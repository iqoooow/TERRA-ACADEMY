import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Users, BarChart3, HelpCircle, Phone, X, MessageCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const features = [
    { icon: ShieldCheck, text: "Faqat adminlar tomonidan boshqariladigan yopiq tizim" },
    { icon: Users, text: "O'quvchi, o'qituvchi va ota-onalar markazlashgan boshqaruvi" },
    { icon: BarChart3, text: "Real vaqtda to'lov, davomat va baho tahlili" },
];

// ── Admin contact info — change these values as needed ──────────
const ADMIN_PHONE = '+998 95 580 16 00';       // ← raqamni o'zgartiring
const ADMIN_TELEGRAM = '@iqooow';                      // ← telegram username (ixtiyoriy)
// ────────────────────────────────────────────────────────────────

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [forgotStep, setForgotStep] = useState(1); // 1=input, 2=success
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleForgotSubmit = async () => {
        const trimmed = forgotUsername.trim().toLowerCase();
        if (!trimmed) return;
        setForgotLoading(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('login_username', trimmed)
                .maybeSingle();
            // Show step 2 regardless (don't reveal if user exists or not — security)
            setForgotStep(2);
        } catch {
            setForgotStep(2);
        } finally {
            setForgotLoading(false);
        }
    };

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

                        {/* Forgot password link */}
                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs text-slate-400 hover:text-blue-500 font-medium transition-colors inline-flex items-center gap-1.5"
                            >
                                <HelpCircle size={13} />
                                Parolni unutdingizmi?
                            </button>
                        </div>
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

            {/* ── Forgot Password Modal ── */}
            <AnimatePresence>
                {showForgotModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotUsername(''); }}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden pointer-events-auto">

                                <AnimatePresence mode="wait">
                                    {/* ── Step 1: Enter login ── */}
                                    {forgotStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-8"
                                        >
                                            {/* Close */}
                                            <button
                                                onClick={() => { setShowForgotModal(false); setForgotUsername(''); }}
                                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-400 transition-all"
                                            >
                                                <X size={15} />
                                            </button>

                                            {/* Icon */}
                                            <div className="flex justify-center mb-6">
                                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                                    <KeyRound size={28} className="text-blue-600" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-1">Parolni tiklash</h3>
                                            <p className="text-sm text-slate-400 text-center font-medium mb-7">
                                                Loginizni kiriting, administrator bilan bog'lanamiz
                                            </p>

                                            {/* Input */}
                                            <div className="mb-4">
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Login</label>
                                                <div className="relative">
                                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={forgotUsername}
                                                        onChange={(e) => setForgotUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium text-sm placeholder:text-slate-400"
                                                        placeholder="loginizni kiriting"
                                                        onKeyDown={(e) => e.key === 'Enter' && forgotUsername.trim() && handleForgotSubmit()}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleForgotSubmit}
                                                disabled={!forgotUsername.trim() || forgotLoading}
                                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                {forgotLoading
                                                    ? <Loader2 size={17} className="animate-spin" />
                                                    : 'Davom etish'
                                                }
                                            </button>

                                            <button
                                                onClick={() => { setShowForgotModal(false); setForgotUsername(''); }}
                                                className="w-full mt-3 py-3 text-slate-400 hover:text-slate-600 font-semibold text-sm transition-colors"
                                            >
                                                Bekor qilish
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* ── Step 2: Contact info ── */}
                                    {forgotStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="p-8"
                                        >
                                            {/* Success icon */}
                                            <div className="flex justify-center mb-5">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                                                    className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center"
                                                >
                                                    <CheckCircle2 size={30} className="text-emerald-500" />
                                                </motion.div>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-1">Login topildi!</h3>
                                            <p className="text-sm text-slate-400 text-center font-medium mb-6">
                                                Parolni tiklash uchun administrator bilan bog'laning
                                            </p>

                                            {/* Contact */}
                                            <div className="space-y-3 mb-6">
                                                <a
                                                    href={`tel:${ADMIN_PHONE.replace(/\s/g, '')}`}
                                                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all group"
                                                >
                                                    <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-all shrink-0">
                                                        <Phone size={16} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                                                        <p className="text-sm font-black text-slate-800">{ADMIN_PHONE}</p>
                                                    </div>
                                                </a>

                                                {ADMIN_TELEGRAM && (
                                                    <a
                                                        href={`https://t.me/${ADMIN_TELEGRAM.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 bg-sky-100 group-hover:bg-sky-200 rounded-xl flex items-center justify-center transition-all shrink-0">
                                                            <MessageCircle size={16} className="text-sky-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telegram</p>
                                                            <p className="text-sm font-black text-slate-800">{ADMIN_TELEGRAM}</p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotUsername(''); }}
                                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm transition-all"
                                            >
                                                Tushundim
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
