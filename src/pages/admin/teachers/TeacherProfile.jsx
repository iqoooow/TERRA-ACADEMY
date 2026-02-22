import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Phone, MapPin, Calendar, Copy,
    ShieldCheck, ShieldX, Key, Pencil, Users, BarChart3,
    CheckCircle2, Loader2, Star, Briefcase, User
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
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${c.cls}`}>{c.label}</span>;
};

const TeacherProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [recentGrades, setRecentGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', subject_specialty: '', bio: '' });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, groupRes, gradesRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', id).single(),
                supabase.from('groups').select('id, name, subjects(name), enrollments(id)').eq('teacher_id', id),
                supabase.from('grades').select('id, title, score, grade_type, date, profiles!student_id(full_name)').eq('teacher_id', id).order('date', { ascending: false }).limit(10),
            ]);

            if (profileRes.error) throw profileRes.error;
            setProfile(profileRes.data);
            setEditForm({
                first_name: profileRes.data.first_name || '',
                last_name: profileRes.data.last_name || '',
                phone: profileRes.data.phone || '',
                subject_specialty: profileRes.data.subject_specialty || '',
                bio: profileRes.data.bio || '',
            });
            setGroups(groupRes.data || []);
            setRecentGrades(gradesRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleToggleBlock = async () => {
        const newStatus = profile.status === 'approved' ? 'rejected' : 'approved';
        setActionLoading(true);
        try {
            await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
            setProfile(prev => ({ ...prev, status: newStatus }));
            toast.success(newStatus === 'approved' ? 'Faollashtirildi' : 'Bloklandi');
        } catch (err) { toast.error(err.message); }
        finally { setActionLoading(false); }
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
                subject_specialty: editForm.subject_specialty,
                bio: editForm.bio,
            }).eq('id', id);
            toast.success("Saqlandi");
            setShowEditModal(false);
            fetchAll();
        } catch (err) { toast.error(err.message); }
    };

    const copyText = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} nusxalandi!`, { icon: '📋' });
    };

    const totalStudents = groups.reduce((s, g) => s + (g.enrollments?.length || 0), 0);
    const avgGrade = recentGrades.length > 0
        ? (recentGrades.reduce((s, g) => s + parseFloat(g.score || 0), 0) / recentGrades.length).toFixed(1)
        : '—';

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Yuklanmoqda...</p>
        </div>
    );

    if (!profile) return (
        <div className="text-center py-20">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">O'qituvchi topilmadi</p>
            <button onClick={() => navigate('/admin/teachers')} className="mt-4 text-violet-500 font-black text-sm hover:underline">← Orqaga</button>
        </div>
    );

    const initials = (profile.full_name || profile.first_name || 'T').charAt(0).toUpperCase();

    return (
        <div className="max-w-[1400px] mx-auto pb-12 space-y-6 animate-fade-in">

            {/* Hero */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-slate-900 to-black opacity-95" />
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />

                <div className="relative z-10 p-8 md:p-10">
                    <button onClick={() => navigate('/admin/teachers')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest">
                        <ArrowLeft size={16} /> O'qituvchilar ro'yxati
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-violet-500/30 shrink-0">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                        {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                                    </h1>
                                    <StatusBadge status={profile.status} />
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {profile.subject_specialty && (
                                        <span className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-[10px] font-black text-violet-300">
                                            {profile.subject_specialty}
                                        </span>
                                    )}
                                    {profile.login_username && (
                                        <button onClick={() => copyText(profile.login_username, 'Login')}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-400 hover:bg-white/10 transition-all font-mono">
                                            @{profile.login_username} <Copy size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all">
                                <Pencil size={14} /> Tahrirlash
                            </button>
                            <button onClick={handleResetPassword} disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50">
                                <Key size={14} /> Parol tiklash
                            </button>
                            <button onClick={handleToggleBlock} disabled={actionLoading}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 border ${profile.status === 'approved'
                                        ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30 text-rose-300'
                                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300'
                                    }`}>
                                {profile.status === 'approved' ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                                {profile.status === 'approved' ? 'Bloklash' : 'Faollashtirish'}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: 'Guruhlar', value: groups.length, icon: Users },
                            { label: "Jami o'quvchilar", value: totalStudents, icon: BookOpen },
                            { label: 'Baholar', value: recentGrades.length, icon: Star },
                            { label: "O'rtacha ball", value: avgGrade, icon: BarChart3 },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={12} className="text-violet-400" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                                </div>
                                <span className="text-2xl font-black text-white">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Section title="Shaxsiy Ma'lumotlar" icon={User}>
                        <InfoRow label="Ism" value={profile.first_name} />
                        <InfoRow label="Familiya" value={profile.last_name} />
                        <InfoRow label="Telefon" value={profile.phone} />
                        <InfoRow label="Mutaxassislik" value={profile.subject_specialty} />
                        <InfoRow label="Tajriba" value={profile.experience_years ? `${profile.experience_years} yil` : null} />
                        <InfoRow label="Manzil" value={profile.address} />
                        <InfoRow label="Qo'shilgan sana" value={profile.created_at ? format(new Date(profile.created_at), 'dd.MM.yyyy') : null} />
                    </Section>

                    {profile.bio && (
                        <Section title="Bio" icon={Briefcase}>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{profile.bio}</p>
                        </Section>
                    )}

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
                            <button onClick={handleResetPassword} disabled={actionLoading}
                                className="w-full py-3 bg-amber-50 border border-amber-100 text-amber-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                <Key size={13} /> terraAcademy ga qaytarish
                            </button>
                        </div>
                    </Section>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Section title="Assigned Guruhlar" icon={Users}>
                        {groups.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium text-center py-4">Hali guruh biriktirilmagan</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {groups.map(g => (
                                    <div key={g.id} className="p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                                        <p className="font-black text-slate-900 text-sm">{g.name}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            {g.subjects?.name && <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">{g.subjects.name}</span>}
                                            <span className="text-[10px] text-slate-400 font-bold">{g.enrollments?.length || 0} o'quvchi</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section title="So'nggi Baholar" icon={Star}>
                        {recentGrades.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium text-center py-4">Hali baho kiritilmagan</p>
                        ) : (
                            <div className="space-y-2">
                                {recentGrades.map(g => (
                                    <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{g.title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                {g.profiles?.full_name} • {g.grade_type} • {g.date ? format(new Date(g.date + 'T12:00:00'), 'dd.MM.yyyy') : '—'}
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
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl" onClick={() => setShowEditModal(false)} />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black text-slate-900 mb-6">Tahrirlash</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ism</label>
                                    <input type="text" value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Familiya</label>
                                    <input type="text" value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Telefon</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mutaxassislik</label>
                                <input type="text" value={editForm.subject_specialty} onChange={e => setEditForm(p => ({ ...p, subject_specialty: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Bio</label>
                                <textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Bekor</button>
                                <button type="submit"
                                    className="flex-[2] py-3.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 shadow-lg transition-all text-xs uppercase tracking-widest">Saqlash</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default TeacherProfile;
