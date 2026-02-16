import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import LoadingScreen from "../components/common/LoadingScreen";

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


            // 1. Try profiles table
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', u.id)
                .single();

            if (profile) {

                return {
                    ...u,
                    role: profile.role || 'student',
                    status: profile.status || 'approved',
                    name: profile.full_name || profile.first_name || u.email,
                    profileData: profile
                };
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'

            }

            // 2. Try applications table
            const { data: application, error: appError } = await supabase
                .from('applications')
                .select('*')
                .eq('id', u.id)
                .single();

            if (application) {

                return {
                    ...u,
                    role: application.role,
                    status: application.status || 'pending', // Usually pending or rejected here
                    name: application.full_name || u.email,
                    applicationData: application
                };
            }

            // 3. Last fallback (really shouldn't happen if registration flow is correct)

            return { ...u, role: 'guest', status: 'unknown', name: u.email };

        } catch (err) {
            console.error('Unexpected error in fetchProfile:', err);
            return { ...u, role: 'guest', status: 'error', name: u.email };
        } finally {
            fetchCache.delete(u.id);
        }
    })();

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

                        // System roles (owner, admin) should be active by default if they exist
                        const isSystemRole = ['owner', 'admin'].includes(role);

                        if (!isSystemRole && status !== 'approved') {
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
                    if (event === 'INITIAL_SESSION') return;

                    if (session?.user) {
                        const enrichedUser = await fetchProfile(session.user);
                        const role = enrichedUser?.role || 'student';
                        const status = enrichedUser?.status || 'pending';

                        const isSystemRole = ['owner', 'admin'].includes(role);

                        if (!isSystemRole && status !== 'approved') {
                            await supabase.auth.signOut();
                            fetchCache.delete(session.user?.id);
                            if (isMounted) setUser(null);
                        } else if (isMounted) {
                            setUser(enrichedUser);
                        }
                    } else {
                        if (isMounted) {
                            setUser(null);
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
            const isSystemRole = ['owner', 'admin'].includes(role);

            if (!isSystemRole && status !== 'approved') {
                await supabase.auth.signOut();
                fetchCache.delete(data.user?.id);
                if (status === 'rejected') {
                    return { success: false, error: 'Arizangiz rad etilgan. Batafsil ma\'lumot uchun administratorga murojaat qiling.' };
                }
                return { success: false, error: 'Arizangiz hali tasdiqlanmagan. Administrator tasdiqlaguncha akkauntga kira olmaysiz.' };
            }


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
                <LoadingScreen />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
