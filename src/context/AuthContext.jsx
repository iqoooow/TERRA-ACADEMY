import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async (u) => {
            if (!u) return null;
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', u.id)
                    .single();
                return { ...u, role: profile?.role || 'student', name: profile?.full_name || u.email };
            } catch (err) {
                console.error('Error fetching profile:', err);
                return { ...u, role: 'student', name: u.email };
            }
        };

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user) {
                    const enrichedUser = await fetchProfile(session.user);
                    if (isMounted) setUser(enrichedUser);
                } else {
                    if (isMounted) setUser(null);
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const enrichedUser = await fetchProfile(session.user);
                if (isMounted) {
                    setUser(enrichedUser);
                    setLoading(false);
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error:', error.message);
                return { success: false, error: error.message };
            }

            // Fetch profile to get role for immediate redirection in Login.jsx
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            console.log('Login: Supabase User ID:', user.id);
            console.log('Login: Profile data from DB:', profile);
            if (profileError) console.error('Login: Profile fetch error:', profileError.message);

            return { success: true, role: profile?.role || 'student' };
        } catch (err) {
            console.error('Unexpected login error:', err);
            return { success: false, error: 'Tizimga kirishda kutilmagan xatolik yuz berdi.' };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const value = {
        user,
        login,
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
