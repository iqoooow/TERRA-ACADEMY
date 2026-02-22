import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, CheckCircle2, Copy, Loader2, User, Phone, BookOpen, DollarSign, GraduationCap, Users, Heart } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { toast } from 'react-hot-toast';

const ROLE_CONFIG = {
    student: {
        label: "O'quvchi",
        color: 'blue',
        icon: GraduationCap,
        gradient: 'from-blue-500 to-indigo-600',
    },
    teacher: {
        label: "O'qituvchi",
        color: 'purple',
        icon: BookOpen,
        gradient: 'from-violet-500 to-purple-600',
    },
    parent: {
        label: "Ota-Ona",
        color: 'emerald',
        icon: Heart,
        gradient: 'from-emerald-500 to-teal-600',
    },
};

const generateStudentCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'STU-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

const normalizeUsername = (firstName, lastName) => {
    return (firstName + lastName)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, ''); // remove non-alphanumeric chars
};

const CreateUserModal = ({ role, onSuccess, onClose }) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
    const Icon = config.icon;

    const [step, setStep] = useState(1); // 1 = form, 2 = success/credentials
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groups, setGroups] = useState([]);
    const [credentials, setCredentials] = useState(null);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        group_id: '',
        monthly_fee: '',
        subject_specialty: '',
    });

    useEffect(() => {
        if (role === 'student') {
            supabase.from('groups').select('id, name').order('name').then(({ data }) => {
                setGroups(data || []);
            });
        }
    }, [role]);

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const getUniqueUsername = async (base) => {
        let username = base;
        let attempt = 1;
        while (true) {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('login_username', username)
                .maybeSingle();
            if (!data) return username;
            attempt++;
            username = base + attempt;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) {
            return toast.error("Ism va familiya majburiy");
        }
        setIsSubmitting(true);

        try {
            // 1. Generate unique login username
            const baseUsername = normalizeUsername(form.first_name.trim(), form.last_name.trim());
            if (!baseUsername) {
                toast.error("Ism familiyadan login yaratib bo'lmadi. Lotin harflarini kiriting.");
                setIsSubmitting(false);
                return;
            }
            const loginUsername = await getUniqueUsername(baseUsername);
            const authEmail = `${loginUsername}@terra.academy`;

            // 2. Create Supabase auth user
            if (!supabaseAdmin) {
                toast.error('Xatolik: VITE_SUPABASE_SERVICE_ROLE_KEY .env faylida yo\'q. Admin foydalanuvchi yarata olmaydi.');
                setIsSubmitting(false);
                return;
            }
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: authEmail,
                password: 'terraAcademy',
                email_confirm: true,
            });

            if (authError) throw authError;
            const newUserId = authData.user.id;

            // 3. Build profile insert
            const studentCode = role === 'student' ? generateStudentCode() : null;
            const profileInsert = {
                id: newUserId,
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
                role,
                status: 'approved',
                phone: form.phone.trim() || null,
                login_username: loginUsername,
                is_first_login: true,
                student_code: studentCode,
                monthly_fee: role === 'student' && form.monthly_fee ? parseFloat(form.monthly_fee) : 0,
                subject_specialty: role === 'teacher' && form.subject_specialty ? form.subject_specialty.trim() : null,
            };

            const { error: profileError } = await supabase.from('profiles').insert(profileInsert);
            if (profileError) {
                // Cleanup auth user if profile insert failed
                if (supabaseAdmin) await supabaseAdmin.auth.admin.deleteUser(newUserId);
                throw profileError;
            }

            // 4. Enroll student in group if selected
            if (role === 'student' && form.group_id) {
                await supabase.from('enrollments').insert({
                    student_id: newUserId,
                    group_id: form.group_id,
                }).select();
                // ignore enrollment errors silently — table may not exist
            }

            // 5. Show credentials
            setCredentials({
                name: `${form.first_name.trim()} ${form.last_name.trim()}`,
                login: loginUsername,
                password: 'terraAcademy',
                studentCode,
            });
            setStep(2);
            onSuccess?.();

        } catch (err) {
            console.error('Create user error:', err);
            toast.error(`Xatolik: ${err.message || 'Foydalanuvchi yaratib bo\'lmadi'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyText = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} nusxalandi!`, { icon: '📋' });
    };

    const inputClass = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400";
    const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2";

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xl"
                onClick={step === 2 ? onClose : undefined}
            />

            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.35)] overflow-hidden"
            >
                {/* Top color bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-all z-10"
                >
                    <X size={18} />
                </button>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        /* ── Step 1: Form ── */
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-8 pt-7"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-7">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                                    <Icon size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        Yangi {config.label} qo'shish
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        Login va parol avtomatik yaratilaLi
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Ism *</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={form.first_name}
                                                onChange={set('first_name')}
                                                className={inputClass + " pl-10"}
                                                placeholder="Asadbek"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Familiya *</label>
                                        <input
                                            type="text"
                                            value={form.last_name}
                                            onChange={set('last_name')}
                                            className={inputClass}
                                            placeholder="Jumanazarov"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className={labelClass}>Telefon</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={set('phone')}
                                            className={inputClass + " pl-10"}
                                            placeholder="+998 90 123 45 67"
                                        />
                                    </div>
                                </div>

                                {/* Student-specific */}
                                {role === 'student' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Guruh</label>
                                            <select
                                                value={form.group_id}
                                                onChange={set('group_id')}
                                                className={inputClass + " cursor-pointer"}
                                            >
                                                <option value="">Guruh tanlang</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Oylik to'lov (so'm)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="number"
                                                    value={form.monthly_fee}
                                                    onChange={set('monthly_fee')}
                                                    className={inputClass + " pl-10"}
                                                    placeholder="500000"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Teacher-specific */}
                                {role === 'teacher' && (
                                    <div>
                                        <label className={labelClass}>Mutaxassislik</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={form.subject_specialty}
                                                onChange={set('subject_specialty')}
                                                className={inputClass + " pl-10"}
                                                placeholder="Ingliz tili"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Auto-login preview */}
                                {(form.first_name || form.last_name) && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Avtomatik yaratiladigan login</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-blue-600 text-sm">
                                                {normalizeUsername(form.first_name, form.last_name) || '...'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">/ parol: <span className="font-black text-slate-600">terraAcademy</span></span>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Bekor
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-[2] py-4 bg-gradient-to-r ${config.gradient} text-white font-black rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60`}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                Yaratish
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        /* ── Step 2: Credentials ── */
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-8 pt-7"
                        >
                            {/* Success header */}
                            <div className="text-center mb-7">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className="w-16 h-16 bg-emerald-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle2 size={32} className="text-emerald-600" />
                                </motion.div>
                                <h2 className="text-xl font-black text-slate-900">{credentials?.name}</h2>
                                <p className="text-sm text-slate-500 mt-1">muvaffaqiyatli qo'shildi. Kirish ma'lumotlari:</p>
                            </div>

                            {/* Credentials cards */}
                            <div className="space-y-3 mb-6">
                                {/* Login */}
                                <div className="flex items-center justify-between bg-slate-950 rounded-2xl px-5 py-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Login</p>
                                        <p className="font-mono font-black text-white text-base tracking-wide">{credentials?.login}</p>
                                    </div>
                                    <button
                                        onClick={() => copyText(credentials?.login, 'Login')}
                                        className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
                                    >
                                        <Copy size={15} />
                                    </button>
                                </div>

                                {/* Password */}
                                <div className="flex items-center justify-between bg-blue-600 rounded-2xl px-5 py-4">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Parol</p>
                                        <p className="font-mono font-black text-white text-base tracking-wide">{credentials?.password}</p>
                                    </div>
                                    <button
                                        onClick={() => copyText(credentials?.password, 'Parol')}
                                        className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
                                    >
                                        <Copy size={15} />
                                    </button>
                                </div>

                                {/* Student code if applicable */}
                                {credentials?.studentCode && (
                                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">O'quvchi kodi</p>
                                            <p className="font-mono font-black text-indigo-700 text-base tracking-wide">{credentials?.studentCode}</p>
                                        </div>
                                        <button
                                            onClick={() => copyText(credentials?.studentCode, "O'quvchi kodi")}
                                            className="w-9 h-9 bg-indigo-100 hover:bg-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 transition-all"
                                        >
                                            <Copy size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-400 font-medium text-center mb-5 leading-relaxed">
                                Bu ma'lumotlarni foydalanuvchiga yetkazing. Birinchi kirishda tizim qo'shimcha ma'lumotlarni so'raydi.
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                            >
                                Tugallash
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default CreateUserModal;
