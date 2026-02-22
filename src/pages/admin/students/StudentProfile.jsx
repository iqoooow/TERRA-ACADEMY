import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, GraduationCap, Phone, MapPin, Calendar, Mail, Copy,
    ShieldCheck, ShieldX, Key, Pencil, Trash2, Users, BookOpen,
    BarChart3, CheckCircle2, XCircle, Clock, CreditCard, Loader2,
    Star, TrendingUp, AlertTriangle, User
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const Section = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden ${className}`}>
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                <Icon size={16} className="text-slate-500" />
            </div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const InfoRow = ({ label, value, mono = false }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-bold text-slate-800 text-right max-w-[60%] ${mono ? 'font-mono' : ''}`}>
            {value || <span className="text-slate-300 italic font-normal">—</span>}
        </span>
    </div>
);

const StatusBadge = ({ status }) => {
    const cfg = {
        approved: { label: 'Faol', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        pending: { label: 'Kutmoqda', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        rejected: { label: 'Bloklangan', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${c.cls}`}>
            {c.label}
        </span>
    );
};

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [grades, setGrades] = useState([]);
    const [attendance, setAttendance] = useState({ present: 0, absent: 0, late: 0 });
    const [payments, setPayments] = useState([]);
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '' });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, enrollRes, gradesRes, attRes, payRes, parentRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', id).single(),
                supabase.from('enrollments').select('group_id, groups(id, name, subjects(name))').eq('student_id', id),
                // grades: recorded_by is the correct FK (teacher_id doesn't exist in schema)
                // grades: use recorded_by column for teacher profile join
                supabase.from('grades').select('id, title, score, grade_type, date, profiles!recorded_by(full_name)').eq('student_id', id).order('date', { ascending: false }).limit(20),
                supabase.from('attendance').select('status').eq('student_id', id),
                // payment_transactions joined via monthly_payments for this student
                // payment_transactions: basic join with monthly_payments
                supabase.from('payment_transactions')
                    .select('id, amount, method, note, created_at, monthly_payments(student_id, payment_month, status)')
                    .eq('monthly_payments.student_id', id)
                    .order('created_at', { ascending: false })
                    .limit(12),
                supabase.from('parent_student').select('status, relationship_type, profiles!parent_id(id, full_name, phone, login_username)').eq('student_id', id).eq('status', 'approved'),
            ]);

            if (profileRes.error) throw profileRes.error;
            setProfile(profileRes.data);
            setEditForm({
                first_name: profileRes.data.first_name || '',
                last_name: profileRes.data.last_name || '',
                phone: profileRes.data.phone || '',
                address: profileRes.data.address || '',
            });

            setGroups((enrollRes.data || []).map(e => e.groups).filter(Boolean));

            setGrades(gradesRes.data || []);

            const att = attRes.data || [];
            setAttendance({
                present: att.filter(a => a.status === 'present').length,
                absent: att.filter(a => a.status === 'absent').length,
                late: att.filter(a => a.status === 'late').length,
            });

            // payment_transactions returns joined rows — flatten for display
            setPayments((payRes.data || []).map(tx => ({
                id: tx.id,
                amount: tx.amount,
                method: tx.method,
                description: tx.note,
                status: tx.monthly_payments?.status || 'paid',
                month: tx.monthly_payments?.payment_month,
                created_at: tx.created_at,
            })));

            setParents((parentRes.data || []).map(r => ({
                ...r.profiles,
                relationship_type: r.relationship_type,
            })));

        } catch (err) {
            console.error(err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleToggleBlock = async () => {
        if (!profile) return;
        const newStatus = profile.status === 'approved' ? 'rejected' : 'approved';
        setActionLoading(true);
        try {
            await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
            setProfile(prev => ({ ...prev, status: newStatus }));
            toast.success(newStatus === 'approved' ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi');
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm("Parolni 'terraAcademy' ga qaytarmoqchimisiz?")) return;
        if (!supabaseAdmin) {
            toast.error('Admin client mavjud emas. VITE_SUPABASE_SERVICE_ROLE_KEY ni .env ga qo\'shing.');
            return;
        }
        setActionLoading(true);
        try {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: 'terraAcademy' });
            if (error) throw error;
            toast.success("Parol 'terraAcademy' ga qaytarildi");
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await supabase.from('profiles').update({
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                full_name: `${editForm.first_name} ${editForm.last_name}`.trim(),
                phone: editForm.phone,
                address: editForm.address,
            }).eq('id', id);
            toast.success("Ma'lumotlar saqlandi");
            setShowEditModal(false);
            fetchAll();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        }
    };

    const copyText = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} nusxalandi!`, { icon: '📋' });
    };

    const totalAtt = attendance.present + attendance.absent + attendance.late;
    const attPercent = totalAtt > 0 ? Math.round((attendance.present / totalAtt) * 100) : 0;
    const avgGrade = grades.length > 0
        ? (grades.reduce((s, g) => s + parseFloat(g.score || 0), 0) / grades.length).toFixed(1)
        : '—';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={36} className="animate-spin text-blue-500" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Yuklanmoqda...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">O'quvchi topilmadi</p>
                <button onClick={() => navigate('/admin/students')} className="mt-4 text-blue-500 font-black text-sm hover:underline">← Orqaga</button>
            </div>
        );
    }

    const initials = (profile.full_name || profile.first_name || 'U').charAt(0).toUpperCase();

    return (
        <div className="max-w-[1400px] mx-auto pb-12 space-y-6 animate-fade-in">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-95" />
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />

                <div className="relative z-10 p-8 md:p-10">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/admin/students')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} /> O'quvchilar ro'yxati
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        {/* Left: identity */}
                        <div className="flex items-center gap-6">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-500/30 shrink-0"
                            >
                                {initials}
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                        {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                                    </h1>
                                    <StatusBadge status={profile.status} />
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {profile.student_code && (
                                        <button
                                            onClick={() => copyText(profile.student_code, "O'quvchi kodi")}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-300 hover:bg-blue-500/30 transition-all"
                                        >
                                            {profile.student_code} <Copy size={10} />
                                        </button>
                                    )}
                                    {profile.login_username && (
                                        <button
                                            onClick={() => copyText(profile.login_username, 'Login')}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-400 hover:bg-white/10 transition-all font-mono"
                                        >
                                            @{profile.login_username} <Copy size={10} />
                                        </button>
                                    )}
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {profile.created_at ? format(new Date(profile.created_at), 'dd.MM.yyyy') : '—'} dan beri
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Pencil size={14} /> Tahrirlash
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                <Key size={14} /> Parol tiklash
                            </button>
                            <button
                                onClick={handleToggleBlock}
                                disabled={actionLoading}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 border ${profile.status === 'approved'
                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30 text-rose-300'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300'
                                    }`}
                            >
                                {profile.status === 'approved' ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                                {profile.status === 'approved' ? 'Bloklash' : 'Faollashtirish'}
                            </button>
                        </div>
                    </div>

                    {/* Quick stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: "O'rtacha ball", value: avgGrade, icon: BarChart3, color: 'blue' },
                            { label: "Jami baholar", value: grades.length, icon: BookOpen, color: 'indigo' },
                            { label: "Davomat %", value: `${attPercent}%`, icon: CheckCircle2, color: 'emerald' },
                            { label: "Guruhlar", value: groups.length, icon: Users, color: 'violet' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={12} className={`text-${color}-400`} />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                                </div>
                                <span className="text-2xl font-black text-white">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column */}
                <div className="space-y-6">
                    {/* Personal info */}
                    <Section title="Shaxsiy Ma'lumotlar" icon={User}>
                        <InfoRow label="Ism" value={profile.first_name} />
                        <InfoRow label="Familiya" value={profile.last_name} />
                        <InfoRow label="Telefon" value={profile.phone} />
                        <InfoRow label="Tug'ilgan sana" value={profile.birth_date ? format(new Date(profile.birth_date + 'T12:00:00'), 'dd.MM.yyyy') : null} />
                        <InfoRow label="Manzil" value={profile.address} />
                    </Section>

                    {/* Login credentials */}
                    <Section title="Kirish Ma'lumotlari" icon={Key}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-slate-950 rounded-2xl px-4 py-3">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Login</p>
                                    <p className="font-mono font-black text-white text-sm">{profile.login_username || '—'}</p>
                                </div>
                                {profile.login_username && (
                                    <button onClick={() => copyText(profile.login_username, 'Login')} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all">
                                        <Copy size={13} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleResetPassword}
                                disabled={actionLoading}
                                className="w-full py-3 bg-amber-50 border border-amber-100 text-amber-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Key size={13} /> Parolni terraAcademy ga qaytarish
                            </button>
                        </div>
                    </Section>

                    {/* Parents */}
                    {parents.length > 0 && (
                        <Section title="Ota-Onalar" icon={Users}>
                            <div className="space-y-3">
                                {parents.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                                            {(p.full_name || 'O').charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 text-sm truncate">{p.full_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.relationship_type || 'vasiy'} • {p.phone || '—'}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/admin/parents/${p.id}`)}
                                            className="ml-auto text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                                        >
                                            <ArrowLeft size={14} className="rotate-180" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>

                {/* Middle + Right columns */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Enrolled groups */}
                    <Section title="Guruhlar" icon={GraduationCap}>
                        {groups.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium text-center py-4">Hech qanday guruhga biriktirilmagan</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {groups.map(g => (
                                    <div key={g.id} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <p className="font-black text-slate-900 text-sm">{g.name}</p>
                                        {g.subjects?.name && (
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">{g.subjects.name}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Attendance */}
                    <Section title="Davomat Statistikasi" icon={CheckCircle2}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {[
                                { label: 'Keldi', val: attendance.present, icon: CheckCircle2, color: 'emerald' },
                                { label: 'Kelmadi', val: attendance.absent, icon: XCircle, color: 'rose' },
                                { label: 'Kechikdi', val: attendance.late, icon: Clock, color: 'amber' },
                            ].map(({ label, val, icon: Icon, color }) => (
                                <div key={label} className={`p-4 bg-${color}-50 border border-${color}-100 rounded-2xl text-center`}>
                                    <Icon size={20} className={`text-${color}-500 mx-auto mb-2`} />
                                    <p className={`text-2xl font-black text-${color}-700`}>{val}</p>
                                    <p className={`text-[10px] font-black text-${color}-600 uppercase tracking-widest`}>{label}</p>
                                </div>
                            ))}
                        </div>
                        {/* Attendance bar */}
                        <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${attPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            />
                        </div>
                        <p className="text-right text-xs font-black text-slate-500 mt-2">{attPercent}% davomat</p>
                    </Section>

                    {/* Grades */}
                    <Section title="So'nggi Baholar" icon={Star}>
                        {grades.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium text-center py-4">Hali baholari yo'q</p>
                        ) : (
                            <div className="space-y-2">
                                {grades.slice(0, 8).map(g => (
                                    <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{g.title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                {g.grade_type} • {g.date ? format(new Date(g.date + 'T12:00:00'), 'dd.MM.yyyy') : '—'}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl font-black text-sm ${parseFloat(g.score) >= 90 ? 'bg-emerald-100 text-emerald-700'
                                            : parseFloat(g.score) >= 70 ? 'bg-blue-100 text-blue-700'
                                                : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {g.score}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Payments */}
                    {payments.length > 0 && (
                        <Section title="To'lovlar" icon={CreditCard}>
                            <div className="space-y-2">
                                {payments.slice(0, 6).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{p.month || p.description || 'To\'lov'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {p.created_at ? format(new Date(p.created_at), 'dd.MM.yyyy') : '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-slate-900 text-sm">
                                                {p.amount ? p.amount.toLocaleString() : '—'} so'm
                                            </span>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                                                : p.status === 'overdue' ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {p.status === 'paid' ? "To'landi" : p.status === 'overdue' ? 'Muddati o\'tgan' : 'Kutilmoqda'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>

            {/* ── Edit Modal ── */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl" onClick={() => setShowEditModal(false)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Ma'lumotlarni tahrirlash</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ism</label>
                                    <input type="text" value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Familiya</label>
                                    <input type="text" value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Telefon</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Manzil</label>
                                <input type="text" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
                                    Bekor
                                </button>
                                <button type="submit"
                                    className="flex-[2] py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg transition-all text-xs uppercase tracking-widest">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
