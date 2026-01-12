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
                    .select('*')
                    .eq('id', u.id)
                    .single();

                return {
                    ...u,
                    role: profile?.role || 'student',
                    status: 'approved', // Default to approved since column missing
                    name: profile?.full_name || profile?.first_name || u.email,
                    profileData: profile // Store full profile data
                };
            } catch (err) {
                console.error('Error fetching profile:', err);
                return { ...u, role: 'student', status: 'approved', name: u.email };
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // If the event is SIGN_IN or similar, we might need to re-fetch profile to get latest status
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
                return { success: false, error: error.message };
            }

            // Fetch profile to check role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Login: Profile fetch error:', profileError.message);
                return { success: true, role: 'student', status: 'approved' }; // Default allowed
            }

            return {
                success: true,
                role: profile?.role || 'student',
                status: 'approved' // Always approved
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

            // Note: The triggers on the Supabase side should handle profile creation.
            // But we might want to manually ensure it if triggers aren't 100% reliable/setup.
            // For now, we rely on the implementation plan's assumption of using Metadata/Triggers or Manual Updates.
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, error: err.message };
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
