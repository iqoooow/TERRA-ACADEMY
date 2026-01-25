import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Per-user fetch cache to prevent redundant simultaneous profile fetches for the same user
const fetchCache = new Map();

const fetchProfile = async (u) => {
    if (!u) return null;

    // If we're already fetching for this specific user, return the existing promise
    if (fetchCache.has(u.id)) {
        return fetchCache.get(u.id);
    }

    // Create a new fetch promise for this user
    const fetchPromise = (async () => {
        try {
            console.log('Fetching profile for user:', u.id, u.email);

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', u.id)
                .single();

            if (error) {
                // If the signal was aborted, we don't want to default to student
                if (error.message?.includes('aborted') || error.name === 'AbortError') {
                    console.log('Profile fetch aborted, skipping default role assignment');
                    return null;
                }

                console.warn('Profile fetch error:', error.message);

                // Check metadata as fallback
                const metadataRole = u.user_metadata?.role || u.app_metadata?.role;
                if (metadataRole) {
                    return { ...u, role: metadataRole, status: 'approved', name: u.email };
                }

                // Absolute last resort fallback for missing profile row
                return { ...u, role: 'student', status: 'approved', name: u.email };
            }

            console.log('Profile fetched successfully. Role:', profile?.role, 'User ID:', u.id);
            
            // Verify the profile belongs to the correct user
            if (profile.id !== u.id) {
                console.error('Profile ID mismatch! Expected:', u.id, 'Got:', profile.id);
                throw new Error('Profile ID mismatch');
            }

            return {
                ...u,
                role: profile?.role || u.user_metadata?.role || 'student',
                status: profile?.status || 'approved',
                name: profile?.full_name || profile?.first_name || u.email,
                profileData: profile
            };
        } catch (err) {
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                return null;
            }
            console.error('Unexpected error in fetchProfile:', err);
            return { ...u, role: 'student', status: 'approved', name: u.email };
        } finally {
            // Remove from cache when done
            fetchCache.delete(u.id);
        }
    })();

    // Store the promise in cache
    fetchCache.set(u.id, fetchPromise);
    return fetchPromise;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let authSubscription = null;

        const initAuth = async () => {
            try {
                // 1. Get initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (isMounted) {
                    if (session?.user) {
                        const enrichedUser = await fetchProfile(session.user);
                        const role = enrichedUser?.role || 'student';
                        const status = enrichedUser?.status || 'pending';
                        const isOwner = role === 'owner';
                        if (!isOwner && status !== 'approved') {
                            await supabase.auth.signOut();
                            fetchCache.delete(session.user?.id);
                            if (isMounted) setUser(null);
                        } else if (isMounted) {
                            setUser(enrichedUser);
                        }
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                }

                // 2. Set up listener for subsequent changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (!isMounted) return;

                    // Skip INITIAL_SESSION event from onAuthStateChange since we handled it with getSession
                    if (event === 'INITIAL_SESSION') return;

                    console.log('Auth state change:', event, session?.user?.email);

                    if (session?.user) {
                        const enrichedUser = await fetchProfile(session.user);
                        const role = enrichedUser?.role || 'student';
                        const status = enrichedUser?.status || 'pending';
                        const isOwner = role === 'owner';
                        if (!isOwner && status !== 'approved') {
                            await supabase.auth.signOut();
                            fetchCache.delete(session.user?.id);
                            if (isMounted) setUser(null);
                        } else if (isMounted) {
                            setUser(enrichedUser);
                        }
                    } else {
                        if (isMounted) {
                            setUser(null);
                            // Clear cache when user logs out
                            fetchCache.clear();
                        }
                    }
                    if (isMounted) setLoading(false);
                });

                authSubscription = subscription;

            } catch (err) {
                console.error('Auth initialization error:', err);
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        // Fallback timeout to prevent stuck loading screen
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Auth initialization timed out');
                setLoading(false);
            }
        }, 10000);

        return () => {
            isMounted = false;
            if (authSubscription) authSubscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            const enriched = await fetchProfile(data.user);
            const role = enriched?.role || 'student';
            const status = enriched?.status || 'pending';
            const isOwner = role === 'owner';

            if (!isOwner && status !== 'approved') {
                await supabase.auth.signOut();
                fetchCache.delete(data.user?.id);
                if (status === 'rejected') {
                    return { success: false, error: 'Arizangiz rad etilgan. Batafsil ma\'lumot uchun administratorga murojaat qiling.' };
                }
                return { success: false, error: 'Arizangiz hali tasdiqlanmagan. Administrator tasdiqlaguncha akkauntga kira olmaysiz.' };
            }

            console.log('Login successful. Redirecting as role:', role);
            setUser(enriched);
            return { success: true, role, status: 'approved' };
        } catch (err) {
            console.error('Unexpected login error:', err);
            return { success: false, error: 'Tizimga kirishda kutilmagan xatolik yuz berdi.' };
        }
    };

    const register = async (email, password, metadata) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) return { success: false, error: error.message };
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            // Clear the fetch cache on logout
            fetchCache.clear();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading TERRA ACADEMY...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
