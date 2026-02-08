import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Users, UserRound, ArrowLeft, CheckCircle2, Shield, Mail, Lock, Phone, User, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        password: '',
        password_confirm: '',
        student_code: ''
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirm) {
            toast.error('Parollar bir-biriga mos kelmadi');
            return;
        }

        setIsLoading(true);

        try {
            const { supabase } = await import('../../lib/supabase');

            // If role is parent, verify student_code exists first
            if (selectedRole === 'parent' && formData.student_code) {
                const { data: studentData, error: studentError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('student_code', formData.student_code.toUpperCase())
                    .eq('role', 'student')
                    .single();

                if (studentError || !studentData) {
                    toast.error('Farzand kodi notoʻgʻri yoki bunday oʻquvchi topilmadi');
                    setIsLoading(false);
                    return;
                }
            }

            const metadata = {
                full_name: `${formData.first_name} ${formData.last_name}`,
                role: selectedRole,
            };

            const { success: regSuccess, user, error: regError } = await register(formData.email, formData.password, metadata);

            if (regSuccess) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        full_name: `${formData.first_name} ${formData.last_name}`,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        birth_date: formData.birth_date || null,
                        role: selectedRole,
                        status: 'pending'
                    });

                if (profileError) {
                    toast.error('Profil yaratishda xatolik yuz berdi');
                } else {
                    setSuccess(true);
                    toast.success('Ro\'yxatdan o\'tish muvaffaqiyatli!');
                }
            } else {
                toast.error(regError || 'Xatolik yuz berdi');
            }
        } catch (err) {
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {roles.map((role, idx) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className="group relative bg-white border border-white/10 p-10 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-center flex flex-col items-center cursor-pointer overflow-hidden"
                                >
                                    <div className={`p-6 bg-slate-100 rounded-3xl mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300`}>
                                        <role.icon size={48} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{role.title}</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">{role.description}</p>
                                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-900 group-hover:bg-blue-600 group-hover:text-white rounded-full text-xs font-black uppercase tracking-widest transition-all">
                                        Tanlash <ArrowRight size={14} />
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

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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

                                {selectedRole === 'parent' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Farzand kodi</label>
                                        <div className="relative group/input">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                            <input name="student_code" required onChange={handleChange} className="input-field pl-12 border-blue-200 bg-blue-50 uppercase font-mono tracking-widest" placeholder="STU-XXXXXX" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parol</label>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                        <input name="password" type="password" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="••••••••" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tasdiqlash</label>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                        <input name="password_confirm" type="password" required onChange={handleChange} className="input-field pl-12 bg-slate-50/50" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-6">
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

