import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Basic fetch cache to prevent redundant simultaneous profile fetches
let currentFetch = null;
let currentFetchUserId = null;

const fetchProfile = async (u) => {
    if (!u) return null;

    // If we're already fetching for this user, return the existing promise
    if (currentFetch && currentFetchUserId === u.id) {
        return currentFetch;
    }

    currentFetchUserId = u.id;
    currentFetch = (async () => {
        try {
            console.log('Fetching profile for user:', u.id, u.email);

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', u.id)
                .single();

            if (error) {
                // If the signal was aborted, we don't want to default to student
                // We should probably just return the user as is or throw/return null
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

            console.log('Profile fetched successfully. Role:', profile?.role);
            return {
                ...u,
                role: profile?.role || u.user_metadata?.role || 'student',
                status: 'approved',
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
            // Only clear if this was the latest fetch
            if (currentFetchUserId === u.id) {
                currentFetch = null;
                currentFetchUserId = null;
            }
        }
    })();

    return currentFetch;
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
                        if (isMounted) setUser(enrichedUser);
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
                        if (isMounted) setUser(enrichedUser);
                    } else {
                        if (isMounted) {
                            setUser(null);
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

            // Immediately fetch profile for the login component to use for redirection
            const enriched = await fetchProfile(data.user);
            console.log('Login successful. Redirecting as role:', enriched?.role);

            return {
                success: true,
                role: enriched?.role || 'student',
                status: 'approved'
            };
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
