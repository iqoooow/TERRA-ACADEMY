import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, User, Phone, MapPin, Calendar, Mail,
    Shield, ShieldOff, Key, Pencil, Loader2, Copy, Check,
    Heart, BookOpen, TrendingUp, Clock, CreditCard, Star,
    ChevronRight, X, Save, Users, GraduationCap
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm";
const labelClass = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5";

// ── Status badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        approved: { label: 'Faol', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        blocked: { label: 'Bloklangan', cls: 'bg-red-100 text-red-700 border-red-200' },
        pending: { label: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    const { label, cls } = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${cls}`}>
            {label}
        </span>
    );
};

// ── Copy button ───────────────────────────────────────────────
const CopyBtn = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
    );
};

// ── Payment status badge ──────────────────────────────────────
const PayBadge = ({ status }) => {
    const map = {
        paid: { label: "To'langan", cls: 'bg-emerald-100 text-emerald-700' },
        pending: { label: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700' },
        overdue: { label: 'Muddati o\'tgan', cls: 'bg-red-100 text-red-700' },
    };
    const { label, cls } = map[status] || map.pending;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${cls}`}>{label}</span>;
};

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
            <Icon size={18} className="text-white" />
        </div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
    </motion.div>
);

// ── Child Card ────────────────────────────────────────────────
const ChildCard = ({ child, onClick }) => {
    const avgGrade = child.avgGrade ?? null;
    const attendancePct = child.attendancePct ?? null;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                        <span className="text-white font-black text-base">
                            {child.full_name?.charAt(0) || 'S'}
                        </span>
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm leading-tight">{child.full_name}</p>
                        {child.student_code && (
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{child.student_code}</p>
                        )}
                    </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
            </div>

            {/* Group info */}
            {child.groupName && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-50">
                    <BookOpen size={13} className="text-blue-400" />
                    <span className="font-medium">{child.groupName}</span>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                    <p className="text-sm font-black text-slate-800">
                        {avgGrade !== null ? avgGrade.toFixed(1) : '—'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Baho</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                    <p className="text-sm font-black text-slate-800">
                        {attendancePct !== null ? `${attendancePct}%` : '—'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Davomat</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                    <PayBadge status={child.paymentStatus || 'pending'} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">To'lov</p>
                </div>
            </div>
        </motion.div>
    );
};

// ── Main Component ────────────────────────────────────────────
const ParentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [parent, setParent] = useState(null);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});

    const setEdit = (field) => (e) => setEditForm(prev => ({ ...prev, [field]: e.target.value }));

    // ── Fetch data ─────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Parent profile
            const { data: parentData, error: parentErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .eq('role', 'parent')
                .single();

            if (parentErr) throw parentErr;
            setParent(parentData);

            // 2. Linked children via parent_student (correct table name per schema)
            const { data: relations } = await supabase
                .from('parent_student')
                .select('student_id, relationship_type')
                .eq('parent_id', id)
                .eq('status', 'approved');

            if (!relations || relations.length === 0) {
                setChildren([]);
                return;
            }

            const studentIds = relations.map(r => r.student_id);

            // 3. Fetch each child's profile + enrollment + grades + attendance + payments
            const childPromises = studentIds.map(async (studentId) => {
                const rel = relations.find(r => r.student_id === studentId);

                const [profileRes, enrollRes, gradesRes, attendRes, paymentsRes] = await Promise.all([
                    supabase.from('profiles').select('id, full_name, student_code, status').eq('id', studentId).single(),
                    // enrollments has no 'status' column — fetch all active (filter removed)
                    supabase.from('enrollments').select('group_id, groups(name, subject_id)').eq('student_id', studentId).limit(1).maybeSingle(),
                    supabase.from('grades').select('score').eq('student_id', studentId),
                    supabase.from('attendance').select('status').eq('student_id', studentId),
                    // monthly_payments is the correct table (payments table doesn't exist)
                    supabase.from('monthly_payments').select('status').eq('student_id', studentId).order('payment_month', { ascending: false }).limit(1).maybeSingle(),
                ]);

                const profile = profileRes.data || {};
                const enrollment = enrollRes.data;
                const grades = gradesRes.data || [];
                const attendances = attendRes.data || [];
                const latestPayment = paymentsRes.data;

                // Compute stats
                const avgGrade = grades.length
                    ? grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length
                    : null;

                const total = attendances.length;
                const present = attendances.filter(a => a.status === 'present').length;
                const attendancePct = total > 0 ? Math.round((present / total) * 100) : null;

                return {
                    ...profile,
                    relationshipType: rel?.relationship_type,
                    groupName: enrollment?.groups?.name,
                    groupSubject: enrollment?.groups?.subject,
                    avgGrade,
                    attendancePct,
                    paymentStatus: latestPayment?.status || 'pending',
                };
            });

            const childrenData = await Promise.all(childPromises);
            setChildren(childrenData);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Ma'lumot yuklashda xatolik: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Block / Activate ───────────────────────────────────────
    const handleToggleStatus = async () => {
        const newStatus = parent.status === 'approved' ? 'blocked' : 'approved';
        try {
            const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setParent(prev => ({ ...prev, status: newStatus }));
            toast.success(newStatus === 'blocked' ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi');
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    // ── Reset password ─────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!window.confirm("Parolni 'terraAcademy' ga qaytarmoqchimisiz?")) return;
        if (!supabaseAdmin) {
            toast.error('Admin client mavjud emas. VITE_SUPABASE_SERVICE_ROLE_KEY ni .env ga qo\'shing.');
            return;
        }
        try {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: 'terraAcademy' });
            if (error) throw error;
            toast.success("Parol 'terraAcademy' ga qayta o'rnatildi");
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    // ── Save edit ──────────────────────────────────────────────
    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const updates = {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                full_name: `${editForm.first_name} ${editForm.last_name}`,
                phone: editForm.phone || null,
                address: editForm.address || null,
                birth_date: editForm.birth_date || null,
            };
            const { error } = await supabase.from('profiles').update(updates).eq('id', id);
            if (error) throw error;
            setParent(prev => ({ ...prev, ...updates }));
            setShowEditModal(false);
            toast.success("Ma'lumotlar yangilandi");
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <p className="text-slate-500 font-medium text-sm">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!parent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-slate-500 font-medium mb-4">Ota-ona topilmadi</p>
                    <button onClick={() => navigate('/admin/parents')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">
                        Orqaga
                    </button>
                </div>
            </div>
        );
    }

    const initials = `${parent.first_name?.charAt(0) || ''}${parent.last_name?.charAt(0) || ''}`.toUpperCase() || 'P';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Hero Header ───────────────────────────────────── */}
            <div className="relative bg-slate-900 overflow-hidden">
                {/* Orb blurs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-600/15 rounded-full blur-[80px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px]" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/admin/parents')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-bold"
                    >
                        <ArrowLeft size={16} />
                        Ota-onalar ro'yxati
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        {/* Left: avatar + info */}
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                {parent.avatar_url ? (
                                    <img src={parent.avatar_url} alt={parent.full_name}
                                        className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white/10" />
                                ) : (
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-4 ring-white/10 shadow-2xl shadow-emerald-500/30">
                                        <span className="text-white font-black text-3xl">{initials}</span>
                                    </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${parent.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            </div>

                            {/* Info */}
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-white tracking-tight">{parent.full_name}</h1>
                                    <StatusBadge status={parent.status} />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[11px] font-black text-emerald-300 uppercase tracking-widest">
                                        <Heart size={10} />
                                        Ota-Ona
                                    </span>
                                    {parent.login_username && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-mono text-slate-400">
                                            @{parent.login_username}
                                        </span>
                                    )}
                                    {parent.created_at && (
                                        <span className="text-xs text-slate-500 font-medium">
                                            Ro'yxatdan {format(new Date(parent.created_at), 'dd.MM.yyyy')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { setEditForm({ ...parent }); setShowEditModal(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Pencil size={14} />
                                Tahrirlash
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleToggleStatus}
                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${parent.status === 'approved'
                                    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                    }`}
                            >
                                {parent.status === 'approved' ? <ShieldOff size={14} /> : <Shield size={14} />}
                                {parent.status === 'approved' ? 'Bloklash' : 'Faollashtirish'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleResetPassword}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Key size={14} />
                                Parolni tiklash
                            </motion.button>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                        {[
                            { label: 'Farzandlar', value: children.length, icon: GraduationCap, color: 'bg-blue-500' },
                            { label: 'Faol bolalar', value: children.filter(c => c.status === 'approved').length, icon: Users, color: 'bg-emerald-500' },
                            { label: "O'rtacha baho", value: children.length ? (children.reduce((s, c) => s + (c.avgGrade || 0), 0) / children.filter(c => c.avgGrade !== null).length || 0).toFixed(1) : '—', icon: Star, color: 'bg-purple-500' },
                            { label: 'O\'rtacha davomat', value: children.length ? `${Math.round(children.reduce((s, c) => s + (c.attendancePct || 0), 0) / (children.filter(c => c.attendancePct !== null).length || 1))}%` : '—', icon: Clock, color: 'bg-amber-500' },
                        ].map((stat, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${stat.color} bg-opacity-20`}>
                                    <stat.icon size={15} className="text-white" />
                                </div>
                                <p className="text-xl font-black text-white">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column */}
                <div className="space-y-6">
                    {/* Personal Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <User size={15} className="text-emerald-600" />
                            </div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Shaxsiy Ma'lumotlar</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: User, label: "Ism Familya", value: parent.full_name },
                                { icon: Phone, label: "Telefon", value: parent.phone || '—' },
                                { icon: Calendar, label: "Tug'ilgan sana", value: parent.birth_date ? format(new Date(parent.birth_date), 'dd.MM.yyyy') : '—' },
                                { icon: MapPin, label: "Manzil", value: parent.address || '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                                    <Icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                                        <p className="text-sm font-bold text-slate-800 break-words">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Login Credentials */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield size={15} className="text-emerald-400" />
                            </div>
                            <h3 className="font-black text-white text-sm uppercase tracking-widest">Login Ma'lumotlari</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Login</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-mono text-emerald-300">{parent.login_username || parent.email || '—'}</p>
                                    {parent.login_username && <CopyBtn text={parent.login_username} />}
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standart parol</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-mono text-slate-300">terraAcademy</p>
                                    <CopyBtn text="terraAcademy" />
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rol</p>
                                <p className="text-sm font-bold text-white">Ota-Ona</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right column — children */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Children header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <GraduationCap size={15} className="text-blue-600" />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Bolalar</h3>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black">
                                    {children.length}
                                </span>
                            </div>
                        </div>

                        {children.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                                    <GraduationCap size={24} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-bold text-sm">Bog'langan farzand yo'q</p>
                                <p className="text-slate-400 text-xs mt-1">Ota-onaga farzand bog'lanmagan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {children.map((child) => (
                                    <ChildCard
                                        key={child.id}
                                        child={child}
                                        onClick={() => navigate(`/admin/students/${child.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Children detail — grades & attendance overview */}
                    {children.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <TrendingUp size={15} className="text-purple-600" />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Farzandlar Umumiy Ko'rsatkichi</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Farzand</th>
                                            <th className="text-center pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Guruh</th>
                                            <th className="text-center pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Baho</th>
                                            <th className="text-center pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Davomat</th>
                                            <th className="text-center pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">To'lov</th>
                                            <th className="pb-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {children.map((child) => (
                                            <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white font-black text-xs">{child.full_name?.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-xs">{child.full_name}</p>
                                                            {child.student_code && (
                                                                <p className="text-[10px] text-slate-400 font-mono">{child.student_code}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className="text-xs text-slate-600 font-medium">{child.groupName || '—'}</span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`font-black text-sm ${child.avgGrade >= 4 ? 'text-emerald-600' : child.avgGrade >= 3 ? 'text-amber-600' : child.avgGrade !== null ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {child.avgGrade !== null ? child.avgGrade.toFixed(1) : '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`font-black text-sm ${child.attendancePct >= 80 ? 'text-emerald-600' : child.attendancePct >= 60 ? 'text-amber-600' : child.attendancePct !== null ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {child.attendancePct !== null ? `${child.attendancePct}%` : '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <PayBadge status={child.paymentStatus || 'pending'} />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/students/${child.id}`)}
                                                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-black transition-colors"
                                                    >
                                                        Batafsil <ChevronRight size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Edit Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-slate-900 text-lg">Ma'lumotlarni tahrirlash</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Ism</label>
                                        <input type="text" value={editForm.first_name || ''} onChange={setEdit('first_name')} className={inputClass} placeholder="Ism" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Familya</label>
                                        <input type="text" value={editForm.last_name || ''} onChange={setEdit('last_name')} className={inputClass} placeholder="Familya" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Telefon</label>
                                    <input type="tel" value={editForm.phone || ''} onChange={setEdit('phone')} className={inputClass} placeholder="+998 90 123 45 67" />
                                </div>
                                <div>
                                    <label className={labelClass}>Tug'ilgan sana</label>
                                    <input type="date" value={editForm.birth_date || ''} onChange={setEdit('birth_date')} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Manzil</label>
                                    <input type="text" value={editForm.address || ''} onChange={setEdit('address')} className={inputClass} placeholder="Shahar, tuman..." />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
                                    Bekor qilish
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    onClick={handleSaveEdit} disabled={saving}
                                    className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /><span>Saqlash</span></>}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParentProfile;
