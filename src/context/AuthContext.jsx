import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import LoadingScreen from "../components/common/LoadingScreen";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Per-user fetch cache to prevent redundant simultaneous profile fetches for the same user
const fetchCache = new Map();

const fetchProfile = async (u) => {
    if (!u) return null;

    if (fetchCache.has(u.id)) {
        return fetchCache.get(u.id);
    }

    const fetchPromise = (async () => {
        try {
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
                    isFirstLogin: profile.is_first_login === true,
                    loginUsername: profile.login_username || null,
                    profileData: profile
                };
            }

            if (error && error.code !== 'PGRST116') {
                console.error('fetchProfile error:', error);
            }

            // Fallback: applications table (legacy path)
            const { data: application } = await supabase
                .from('applications')
                .select('*')
                .eq('id', u.id)
                .single();

            if (application) {
                return {
                    ...u,
                    role: application.role,
                    status: application.status || 'pending',
                    name: application.full_name || u.email,
                    isFirstLogin: false,
                    loginUsername: null,
                    applicationData: application
                };
            }

            return { ...u, role: 'guest', status: 'unknown', name: u.email, isFirstLogin: false, loginUsername: null };

        } catch (err) {
            console.error('Unexpected error in fetchProfile:', err);
            return { ...u, role: 'guest', status: 'error', name: u.email, isFirstLogin: false, loginUsername: null };
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
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    // Handle specific error: Invalid Refresh Token
                    if (sessionError.message?.toLowerCase().includes('refresh token')) {
                        console.warn('Invalid refresh token detected. Signing out...');
                        await supabase.auth.signOut();
                        if (isMounted) setUser(null);
                    }
                    throw sessionError;
                }

                if (isMounted) {
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
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                // Clear user on auth error to prevent stale state
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
                }
            } finally {
                if (isMounted) setLoading(false);
            }

            if (!isMounted) return;

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!isMounted) return;

                // Handle TOKEN_REFRESHED error or SIGNED_OUT
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    fetchCache.clear();
                    return;
                }

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
        };

        initAuth();

        const timeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 10000);

        return () => {
            isMounted = false;
            if (authSubscription) authSubscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    // Login with username (auto-appends @terra.academy if no @ present)
    const login = async (usernameOrEmail, password) => {
        try {
            const authEmail = usernameOrEmail.includes('@')
                ? usernameOrEmail
                : `${usernameOrEmail.trim().toLowerCase()}@terra.academy`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password,
            });

            if (error) {
                return { success: false, error: "Login yoki parol noto'g'ri" };
            }

            const enriched = await fetchProfile(data.user);
            const role = enriched?.role || 'student';
            const status = enriched?.status || 'pending';
            const isSystemRole = ['owner', 'admin'].includes(role);

            if (!isSystemRole && status !== 'approved') {
                await supabase.auth.signOut();
                fetchCache.delete(data.user?.id);
                if (status === 'rejected') {
                    return { success: false, error: 'Hisobingiz bloklangan. Administrator bilan bog\'laning.' };
                }
                return { success: false, error: 'Hisobingiz hali faollashtrilmagan.' };
            }

            setUser(enriched);
            return {
                success: true,
                role,
                isFirstLogin: enriched?.isFirstLogin === true
            };
        } catch (err) {
            console.error('Unexpected login error:', err);
            return { success: false, error: 'Tizimga kirishda xatolik yuz berdi.' };
        }
    };

    // Re-fetch profile from DB and update user state (called after first-login setup, settings changes)
    const refreshProfile = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        fetchCache.delete(session.user.id);
        const enriched = await fetchProfile(session.user);
        setUser(enriched);
    }, []);

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            fetchCache.clear();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const value = {
        user,
        login,
        logout,
        refreshProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
};
