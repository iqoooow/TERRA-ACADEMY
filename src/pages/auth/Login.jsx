import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { success, role, error: loginError } = await login(email, password);
            if (success) {
                toast.success('Xush kelibsiz!');
                if (role === 'owner') navigate('/admin/dashboard');
                else if (role === 'teacher') navigate('/teacher/dashboard');
                else if (role === 'student') navigate('/student/dashboard');
                else if (role === 'parent') navigate('/parent/dashboard');
                else navigate('/admin/dashboard');
            } else {
                toast.error(loginError || 'Email yoki parol noto\'g\'ri');
            }
        } catch (err) {
            toast.error('Tizimga kirishda xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] z-10"
            >
                <div className="glass-card !bg-white/10 backdrop-blur-3xl border-white/20 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

                    <div className="text-center mb-12">
                        <motion.div
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="inline-flex p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/40 mb-8"
                        >
                            <GraduationCap size={44} className="text-white" />
                        </motion.div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3 italic">TERRA <span className="text-blue-400">ACADEMY</span></h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Management Intelligence System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Identifier</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-white placeholder:text-slate-600 font-bold text-sm"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Keyword</label>
                                <Link to="#" className="text-[10px] font-black text-blue-400 hover:text-white transition-all uppercase tracking-widest">Forgot?</Link>
                            </div>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-white placeholder:text-slate-600 font-bold text-sm"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Secure Login
                                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </motion.button>

                        <div className="text-center pt-4">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-loose">
                                New to the academy? <br />
                                <Link to="/register" className="text-blue-400 hover:text-white font-black decoration-2 underline-offset-8 hover:underline transition-all">Create Professional Account</Link>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="mt-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] opacity-50 space-x-4">
                    <span>SECURITY</span>
                    <span>&bull;</span>
                    <span>PRIVACY</span>
                    <span>&bull;</span>
                    <span>PERFORMANCE</span>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;

