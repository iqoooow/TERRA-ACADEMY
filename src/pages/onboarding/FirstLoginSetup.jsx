import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, User, Phone, MapPin, Calendar, BookOpen, Briefcase, MessageSquare, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ROLE_LABELS = {
    student: "O'quvchi",
    teacher: "O'qituvchi",
    parent: "Ota-Ona",
    admin: "Administrator",
    owner: "Egasi",
};

const ROLE_DASHBOARDS = {
    admin: '/admin/dashboard',
    owner: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard',
};

const inputClass = "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm";
const labelClass = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-2";

const FirstLoginSetup = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'student';
    const name = user?.name || user?.profileData?.full_name || '';

    const [step, setStep] = useState(1);
    const totalSteps = role === 'teacher' ? 2 : 2;
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        phone: user?.profileData?.phone || '',
        birth_date: '',
        address: '',
        // Teacher specific
        subject_specialty: user?.profileData?.subject_specialty || '',
        experience_years: '',
        bio: '',
        // Student/parent
        message: '',
    });

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleComplete = async () => {
        setSaving(true);
        try {
            const updates = {
                phone: form.phone || null,
                birth_date: form.birth_date || null,
                address: form.address || null,
                is_first_login: false,
            };

            if (role === 'teacher') {
                updates.subject_specialty = form.subject_specialty || null;
                updates.experience_years = form.experience_years ? parseInt(form.experience_years) : null;
                updates.bio = form.bio || null;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast.success("Profil muvaffaqiyatli to'ldirildi!");
            navigate(ROLE_DASHBOARDS[role] || '/');
        } catch (err) {
            console.error('Setup error:', err);
            toast.error("Saqlashda xatolik: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        setSaving(true);
        try {
            await supabase.from('profiles').update({ is_first_login: false }).eq('id', user.id);
            await refreshProfile();
            navigate(ROLE_DASHBOARDS[role] || '/');
        } catch {
            navigate(ROLE_DASHBOARDS[role] || '/');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-slate-50">
            {/* ── Left decorative panel ── */}
            <div className="hidden lg:flex lg:w-[42%] bg-slate-950 flex-col items-center justify-center p-12 relative overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -60, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]"
                />

                <div className="relative z-10 max-w-sm w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-14">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                            <GraduationCap size={26} className="text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-black text-white tracking-tight">TERRA <span className="text-blue-400">ACADEMY</span></div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Boshqaruv tizimi</div>
                        </div>
                    </div>

                    {/* Welcome message */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-6">
                            Birinchi kirish
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight tracking-tight mb-4">
                            Xush kelibsiz,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{name.split(' ')[0]}!</span>
                        </h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                            Tizimga muvaffaqiyatli kirdingiz. Profilingizni to'liq to'ldiring — bu tizim unumdorligini oshiradi.
                        </p>

                        {/* Role badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                            <User size={14} className="text-blue-400" />
                            <span className="text-sm font-black text-white">{ROLE_LABELS[role] || role}</span>
                        </div>
                    </motion.div>

                    {/* Step indicator */}
                    <div className="mt-14">
                        <div className="flex items-center gap-2 mb-3">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        i < step ? 'bg-blue-500' : i === step - 1 ? 'bg-blue-400 flex-1' : 'bg-white/10'
                                    } ${i === step - 1 ? 'flex-1' : 'w-8'}`}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Qadam {step} / {totalSteps}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                {/* Mobile header */}
                <div className="absolute top-5 left-5 flex items-center gap-2 lg:hidden">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <GraduationCap size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-black text-slate-800">TERRA ACADEMY</span>
                </div>

                <div className="w-full max-w-[460px]">
                    {/* Mobile step indicator */}
                    <div className="flex gap-1.5 mb-8 lg:hidden">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full flex-1 transition-all ${i < step ? 'bg-blue-500' : 'bg-slate-200'}`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Shaxsiy ma'lumotlar</h1>
                                    <p className="text-slate-500 text-sm">Quyidagi ma'lumotlarni kiriting. Ularni keyinchalik ham o'zgartirish mumkin.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Telefon raqam</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={set('phone')}
                                                className={inputClass + " pl-11"}
                                                placeholder="+998 90 123 45 67"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Tug'ilgan sana</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="date"
                                                value={form.birth_date}
                                                onChange={set('birth_date')}
                                                className={inputClass + " pl-11"}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Yashash manzili</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={form.address}
                                                onChange={set('address')}
                                                className={inputClass + " pl-11"}
                                                placeholder="Shahar, tuman, ko'cha..."
                                            />
                                        </div>
                                    </div>

                                    {/* Non-teacher: message to admin */}
                                    {role !== 'teacher' && (
                                        <div>
                                            <label className={labelClass}>Admin uchun xabar (ixtiyoriy)</label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                                <textarea
                                                    value={form.message}
                                                    onChange={set('message')}
                                                    rows={3}
                                                    className={inputClass + " pl-11 resize-none"}
                                                    placeholder="Qo'shimcha ma'lumot yoki savol..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={handleSkip}
                                        disabled={saving}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                    >
                                        Keyinroq
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => role === 'teacher' ? setStep(2) : handleComplete()}
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : role === 'teacher' ? (
                                            <><span>Keyingi</span><ArrowRight size={16} /></>
                                        ) : (
                                            <><CheckCircle2 size={16} /><span>Tugatish</span></>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && role === 'teacher' && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Kasbiy ma'lumotlar</h1>
                                    <p className="text-slate-500 text-sm">O'qituvchi sifatidagi tajriba va mutaxassisligingiz.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Mutaxassislik / Fan</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={form.subject_specialty}
                                                onChange={set('subject_specialty')}
                                                className={inputClass + " pl-11"}
                                                placeholder="Ingliz tili, Matematika..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Ish tajribasi (yil)</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                value={form.experience_years}
                                                onChange={set('experience_years')}
                                                className={inputClass + " pl-11"}
                                                placeholder="5"
                                                min="0"
                                                max="50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>O'zingiz haqingizda</label>
                                        <textarea
                                            value={form.bio}
                                            onChange={set('bio')}
                                            rows={4}
                                            className={inputClass + " resize-none"}
                                            placeholder="Qisqacha ma'lumot: ta'lim yo'nalishi, yutuqlar..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-2 px-5 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                    >
                                        <ArrowLeft size={16} />
                                        Orqaga
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleComplete}
                                        disabled={saving}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <><CheckCircle2 size={16} /><span>Profilni saqlash</span></>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FirstLoginSetup;
