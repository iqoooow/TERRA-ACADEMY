import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const features = [
    { icon: ShieldCheck, text: "Faqat adminlar tomonidan boshqariladigan yopiq tizim" },
    { icon: Users, text: "O'quvchi, o'qituvchi va ota-onalar markazlashgan boshqaruvi" },
    { icon: BarChart3, text: "Real vaqtda to'lov, davomat va baho tahlili" },
];

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return toast.error("Login kiriting");
        setIsLoading(true);

        try {
            const { success, role, isFirstLogin, error: loginError } = await login(username.trim(), password);
            if (success) {
                toast.success('Xush kelibsiz!');
                if (isFirstLogin) {
                    navigate('/setup');
                } else if (role === 'owner' || role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (role === 'teacher') {
                    navigate('/teacher/dashboard');
                } else if (role === 'student') {
                    navigate('/student/dashboard');
                } else if (role === 'parent') {
                    navigate('/parent/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                toast.error(loginError || "Login yoki parol noto'g'ri");
            }
        } catch {
            toast.error('Tizimga kirishda xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left Brand Panel ── */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-14 overflow-hidden bg-slate-950">
                <motion.div
                    animate={{ scale: [1, 1.25, 1], rotate: [0, 60, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -60, 0] }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-40 -right-20 w-[440px] h-[440px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"
                />

                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                <div className="relative z-10 max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-4 mb-16"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                            <GraduationCap size={30} className="text-white" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white tracking-tight">TERRA <span className="text-blue-400">ACADEMY</span></div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Boshqaruv tizimi</div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
                            Ta'limni<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                yangi darajaga
                            </span><br />
                            ko'taring
                        </h2>
                        <p className="text-slate-400 text-base font-medium leading-relaxed mb-10">
                            Zamonaviy boshqaruv tizimi orqali akademiyangizni samarali boshqaring.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="space-y-4 mb-14">
                        {features.map(({ icon: Icon, text }, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="flex items-center gap-4"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-blue-400" />
                                </div>
                                <span className="text-slate-300 text-sm font-medium">{text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center gap-6 pt-8 border-t border-white/5"
                    >
                        {[
                            { val: '500+', label: "O'quvchilar" },
                            { val: '50+', label: "O'qituvchilar" },
                            { val: '98%', label: 'Muvaffaqiyat' },
                        ].map(({ val, label }) => (
                            <div key={label}>
                                <div className="text-xl font-black text-white">{val}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white relative">
                {/* Mobile logo */}
                <div className="absolute top-6 left-6 flex items-center gap-3 lg:hidden">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <GraduationCap size={18} className="text-white" />
                    </div>
                    <span className="text-base font-black text-slate-900 tracking-tight">TERRA <span className="text-blue-500">ACADEMY</span></span>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tizimga kirish</h1>
                        <p className="text-slate-500 text-sm font-medium">Administrator tomonidan berilgan login va parol bilan kiring.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Login</label>
                            <div className="relative group/input">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-sm hover:border-slate-300"
                                    placeholder="asadbekjumanazarov"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Parol</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-sm hover:border-slate-300"
                                    placeholder="••••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em] mt-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Kirish
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Info notice */}
                    <div className="mt-7 flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5">
                        <ShieldCheck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Kirish huquqi faqat administrator tomonidan beriladi. Login va parolni administrator sizga beradi.
                        </p>
                    </div>

                    <p className="mt-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                        Xavfsizlik &bull; Maxfiylik &bull; Tezlik
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
