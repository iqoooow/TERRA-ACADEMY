import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, UserRound, ArrowLeft, CheckCircle2, Shield, Mail, Lock, Phone, User, Calendar, ArrowRight, Loader2, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: 'Juda zaif', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Zaif', color: 'bg-orange-500' };
    if (score === 3) return { score, label: "O'rtacha", color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Kuchli', color: 'bg-blue-500' };
    return { score, label: 'Juda kuchli', color: 'bg-emerald-500' };
};

const RELATIONSHIP_TYPES = [
    { value: 'father', label: 'Ota' },
    { value: 'mother', label: 'Ona' },
    { value: 'guardian', label: 'Vasiy' },
];

const Register = () => {
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        password: '',
        password_confirm: '',
    });

    // Multi-child entries: [{ code: string, type: 'father'|'mother'|'guardian' }]
    const [children, setChildren] = useState([{ code: '', type: 'guardian' }]);

    // Deep link handling: ?role=parent&code=STU-XXXXXX
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const role = params.get('role');
        const code = params.get('code');
        if (role && ['student', 'teacher', 'parent'].includes(role)) {
            setSelectedRole(role);
            setStep(2);
        }
        if (code) {
            setChildren([{ code: code.toUpperCase(), type: 'guardian' }]);
        }
    }, []);

    const roles = [
        { id: 'teacher', title: "O'qituvchi", icon: GraduationCap, description: 'Darslarni boshqarish, baholash va o\'quvchilar bilan ishlash', color: 'blue' },
        { id: 'student', title: "O'quvchi", icon: UserRound, description: 'Bilim olish, vazifalarni bajarish va natijalarni kuzatish', color: 'indigo' },
        { id: 'parent', title: 'Ota-ona', icon: Users, description: 'Farzand davomati, baholari va to\'lovlarini nazorat qilish', color: 'purple' }
    ];

    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
        setStep(2);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChildChange = (idx, field, value) => {
        setChildren(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const handleAddChild = () => {
        setChildren(prev => [...prev, { code: '', type: 'guardian' }]);
    };

    const handleRemoveChild = (idx) => {
        setChildren(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            toast.error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
            return;
        }

        if (formData.password !== formData.password_confirm) {
            toast.error('Parollar bir-biriga mos kelmadi');
            return;
        }

        setIsLoading(true);

        try {
            const { supabase } = await import('../../lib/supabase');

            // If parent: validate each student code
            if (selectedRole === 'parent') {
                const filledChildren = children.filter(c => c.code.trim());
                if (filledChildren.length === 0) {
                    toast.error('Kamida 1 ta farzand kodini kiriting');
                    setIsLoading(false);
                    return;
                }

                for (const child of filledChildren) {
                    const { data: studentData } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('student_code', child.code.toUpperCase().trim())
                        .eq('role', 'student')
                        .single();

                    if (!studentData) {
                        toast.error(`"${child.code}" — bunday o'quvchi kodi topilmadi`);
                        setIsLoading(false);
                        return;
                    }
                }
            }

            const metadata = {
                full_name: `${formData.first_name} ${formData.last_name}`,
                role: selectedRole,
            };

            const { success: regSuccess, user, error: regError } = await register(formData.email, formData.password, metadata);

            if (regSuccess) {
                // Build student_code field: JSON for multi-child, null for others
                let studentCodeField = null;
                if (selectedRole === 'parent') {
                    const filledChildren = children
                        .filter(c => c.code.trim())
                        .map(c => ({ code: c.code.toUpperCase().trim(), type: c.type }));
                    studentCodeField = JSON.stringify(filledChildren);
                }

                const { error: appError } = await supabase
                    .from('applications')
                    .insert({
                        id: user.id,
                        full_name: `${formData.first_name} ${formData.last_name}`,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        email: formData.email,
                        birth_date: formData.birth_date || null,
                        role: selectedRole,
                        student_code: studentCodeField,
                        status: 'pending'
                    });

                if (appError) {
                    console.error('Application insert error:', appError);
                    toast.error('Arizani saqlashda xatolik yuz berdi');
                } else {
                    setSuccess(true);
                    toast.success('Arizangiz qabul qilindi!');
                }
            } else {
                toast.error(regError || 'Xatolik yuz berdi');
            }
        } catch (err) {
            console.error(err);
            toast.error('Kutilmagan xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center"
                >
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={48} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Qabul qilindi!</h2>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        Arizangiz muvaffaqiyatli yuborildi. Administrator tasdiqlagandan so'ng tizimga kirishingiz mumkin bo'ladi.
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary w-full py-4 text-sm uppercase tracking-widest"
                    >
                        Kirish sahifasiga qaytish
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 lg:p-10 relative overflow-hidden font-sans text-slate-100">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="z-10 w-full max-w-5xl">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex p-3 bg-white/5 rounded-2xl mb-4"
                    >
                        <GraduationCap size={32} className="text-blue-400" />
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">TERRA ACADEMY</h1>
                    <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">Kelajak ta'limi bugundan boshlanadi</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className="group relative bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] hover:bg-white hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)] transition-all duration-500 text-center flex flex-col items-center cursor-pointer overflow-hidden active:scale-95"
                                >
                                    <div className={`p-8 bg-white/5 rounded-[2.5rem] mb-8 group-hover:scale-110 group-hover:bg-${role.color}-600 group-hover:text-white transition-all duration-500 shadow-2xl group-hover:shadow-${role.color}-500/40 text-${role.color}-400`}>
                                        <role.icon size={56} strokeWidth={1.2} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white group-hover:text-slate-900 mb-4 tracking-tighter transition-colors">{role.title}</h3>
                                    <p className="text-slate-400 group-hover:text-slate-500 font-bold text-xs leading-relaxed mb-10 uppercase tracking-widest">{role.description}</p>
                                    <div className={`inline-flex items-center gap-3 px-8 py-3 bg-white/5 text-white group-hover:bg-${role.color}-600 group-hover:text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 group-hover:border-transparent`}>
                                        Begin Selection <ArrowRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden text-slate-900"
                        >
                            <button
                                onClick={() => setStep(1)}
                                className="inline-flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors font-bold text-sm uppercase tracking-widest"
                            >
                                <ArrowLeft size={18} className="mr-2" />
                                Orqaga
                            </button>

                            <div className="mb-10">
                                <span className="text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] bg-blue-50 px-3 py-1 rounded-full">{selectedRole} sifati ro'yxatdan o'tish</span>
                                <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">Ma'lumotlarni to'ldiring</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ism</label>
                                        <div className="relative group/input">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input name="first_name" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="Ali" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Familya</label>
                                        <div className="relative group/input">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input name="last_name" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="Valiyev" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                        <div className="relative group/input">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input name="email" type="email" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="ali@example.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefon</label>
                                        <div className="relative group/input">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input name="phone" type="tel" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="+998 90 123 45 67" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tug'ilgan sana</label>
                                        <div className="relative group/input">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input name="birth_date" type="date" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" />
                                        </div>
                                    </div>

                                    {/* Password fields */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parol</label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                onChange={handleChange}
                                                className="input-field pl-12 pr-12 bg-slate-50/50"
                                                placeholder="En kamida 8 ta belgi"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {formData.password && (() => {
                                            const strength = getPasswordStrength(formData.password);
                                            return (
                                                <div className="px-1 space-y-1">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-orange-500' : strength.score <= 3 ? 'text-yellow-600' : strength.score <= 4 ? 'text-blue-500' : 'text-emerald-500'}`}>
                                                        {strength.label}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parolni tasdiqlang</label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                            <input
                                                name="password_confirm"
                                                type={showConfirm ? 'text' : 'password'}
                                                required
                                                onChange={handleChange}
                                                className={`input-field pl-12 pr-12 bg-slate-50/50 ${formData.password_confirm && formData.password !== formData.password_confirm ? 'border-red-300 focus:border-red-400' : ''}`}
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {formData.password_confirm && formData.password !== formData.password_confirm && (
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Parollar mos kelmaydi</p>
                                        )}
                                    </div>
                                </div>

                                {/* Multi-child section (parents only) */}
                                {selectedRole === 'parent' && (
                                    <div className="border-t border-slate-100 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Farzandlar</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Har bir farzandning STU-XXXXXX kodini kiriting</p>
                                            </div>
                                            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                {children.length} ta farzand
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <AnimatePresence>
                                                {children.map((child, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                                        className="flex items-center gap-3"
                                                    >
                                                        {/* Code input */}
                                                        <div className="relative flex-1 group/input">
                                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" size={16} />
                                                            <input
                                                                type="text"
                                                                value={child.code}
                                                                onChange={e => handleChildChange(idx, 'code', e.target.value)}
                                                                required={idx === 0}
                                                                placeholder={`Farzand ${idx + 1} kodi: STU-XXXXXX`}
                                                                className="input-field pl-10 pr-4 bg-purple-50/50 border-purple-200 focus:border-purple-400 uppercase font-mono tracking-widest text-sm"
                                                            />
                                                        </div>

                                                        {/* Relationship type selector */}
                                                        <select
                                                            value={child.type}
                                                            onChange={e => handleChildChange(idx, 'type', e.target.value)}
                                                            className="py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:outline-none cursor-pointer"
                                                        >
                                                            {RELATIONSHIP_TYPES.map(rt => (
                                                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                                                            ))}
                                                        </select>

                                                        {/* Remove button (only if more than 1) */}
                                                        {children.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveChild(idx)}
                                                                className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shrink-0"
                                                                title="O'chirish"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        {/* Add child button */}
                                        <button
                                            type="button"
                                            onClick={handleAddChild}
                                            className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-200 text-purple-600 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Plus size={16} />
                                            Boshqa farzand qo'shish
                                        </button>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-primary w-full py-4 text-sm uppercase tracking-widest"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Ro\'yxatdan o\'tish'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 text-center">
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                        Akkauntingiz bormi? <Link to="/login" className="text-blue-400 hover:text-white transition-colors ml-2 underline decoration-2 underline-offset-4">Kirish</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
