import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, BookOpen, GraduationCap, Users } from 'lucide-react';

const Login = () => {
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { success, role, error: loginError } = await login(email, password);
        setIsLoading(false);
        if (success) {
            if (role === 'owner') navigate('/admin/dashboard');
            else if (role === 'teacher') navigate('/teacher/dashboard');
            else if (role === 'student') navigate('/student/dashboard');
            else if (role === 'parent') navigate('/parent/dashboard');
            else navigate('/admin/dashboard');
        } else {
            setError(loginError || 'Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-900 overflow-hidden relative font-sans text-gray-100">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>

            <div className="z-10 w-full max-w-md m-auto p-8 bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50">
                            <GraduationCap size={32} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">TERRA ACADEMY</h1>
                    <p className="text-gray-400 text-sm">Welcome back! Please access your account.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                    <div className="mt-4 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Register</Link>
                        </p>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
                    <p>&copy; 2026 Terra Academy Platform. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
