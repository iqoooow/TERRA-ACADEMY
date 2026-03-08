import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldX, Clock, GraduationCap, Calendar, Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TABS = [
    { id: 'grades', label: 'Baholar', icon: GraduationCap },
    { id: 'attendance', label: 'Davomat', icon: Calendar },
];

const STATUS_BADGE = {
    pending: <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100"><Clock size={10} /> Kutilmoqda</span>,
    approved: <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100"><ShieldCheck size={10} /> Tasdiqlangan</span>,
    rejected: <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase border border-rose-100"><ShieldX size={10} /> Rad etilgan</span>,
};

const ATT_LABEL = { present: 'Keldi', absent: 'Kelmadi', late: 'Kechikdi' };
const ATT_COLOR = { present: 'bg-emerald-100 text-emerald-700', absent: 'bg-rose-100 text-rose-700', late: 'bg-amber-100 text-amber-700' };

const ApprovalCenter = () => {
    const [tab, setTab] = useState('grades');
    const [grades, setGrades] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('pending');

    const fetchGrades = async () => {
        const { data, error } = await supabase
            .from('grades')
            .select(`
                id, title, score, grade_type, date, approval_status,
                profiles!student_id (full_name, first_name),
                groups (name, subjects (name)),
                recorder:profiles!recorded_by (full_name, first_name)
            `)
            .order('date', { ascending: false });
        if (error) { console.error(error); return; }
        setGrades(data || []);
    };

    const fetchAttendance = async () => {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id, date, status, approval_status,
                profiles!student_id (full_name, first_name),
                groups (name, subjects (name)),
                recorder:profiles!recorded_by (full_name, first_name)
            `)
            .order('date', { ascending: false });
        if (error) { console.error(error); return; }
        setAttendance(data || []);
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchGrades(), fetchAttendance()]);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleGradeAction = async (id, action) => {
        setActionLoading(id + action);
        try {
            const { error } = await supabase
                .from('grades')
                .update({ approval_status: action })
                .eq('id', id);
            if (error) throw error;
            toast.success(action === 'approved' ? 'Baho tasdiqlandi!' : 'Baho rad etildi');
            await fetchGrades();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAttendanceAction = async (id, action) => {
        setActionLoading(id + action);
        try {
            const { error } = await supabase
                .from('attendance')
                .update({ approval_status: action })
                .eq('id', id);
            if (error) throw error;
            toast.success(action === 'approved' ? 'Davomat tasdiqlandi!' : 'Davomat rad etildi');
            await fetchAttendance();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredGrades = grades.filter(g => filter === 'all' || g.approval_status === filter);
    const filteredAttendance = attendance.filter(a => filter === 'all' || a.approval_status === filter);
    const pendingGrades = grades.filter(g => g.approval_status === 'pending').length;
    const pendingAttendance = attendance.filter(a => a.approval_status === 'pending').length;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-slate-900 to-indigo-900 opacity-90"></div>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-500/20 rounded-full blur-[80px]"></div>
                <div className="relative z-10 p-8 md:p-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-violet-300"
                    >
                        <ShieldCheck size={12} /> Tasdiqlash Markazi
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Baho va Davomat Tasdiqlash</h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        O'qituvchilar tomonidan kiritilgan baho va davomatlarni ko'rib chiqing va tasdiqlang.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-300 text-sm font-black">
                            {pendingGrades} ta baho kutilmoqda
                        </div>
                        <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-300 text-sm font-black">
                            {pendingAttendance} ta davomat kutilmoqda
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs + Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 shadow-sm">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                tab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.id === 'grades' && pendingGrades > 0 && (
                                <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center">{pendingGrades}</span>
                            )}
                            {t.id === 'attendance' && pendingAttendance > 0 && (
                                <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center">{pendingAttendance}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 shadow-sm">
                    {[{ v: 'pending', l: 'Kutilmoqda' }, { v: 'approved', l: 'Tasdiqlangan' }, { v: 'rejected', l: 'Rad etilgan' }, { v: 'all', l: 'Barchasi' }].map(({ v, l }) => (
                        <button
                            key={v}
                            onClick={() => setFilter(v)}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                filter === v ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >{l}</button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-500" size={40} /></div>
            ) : tab === 'grades' ? (
                filteredGrades.length === 0 ? (
                    <div className="py-24 flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <GraduationCap size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Baholar yo'q</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredGrades.map((g, i) => {
                                const studentName = g.profiles?.full_name || g.profiles?.first_name || '—';
                                const recorderName = g.recorder?.full_name || g.recorder?.first_name || '—';
                                return (
                                    <motion.div
                                        key={g.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-violet-100 hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-black text-slate-900">{studentName}</span>
                                                <span className="text-slate-400 text-xs">•</span>
                                                <span className="text-slate-500 text-sm font-medium">{g.groups?.name}</span>
                                                {STATUS_BADGE[g.approval_status] || STATUS_BADGE.pending}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">{g.title} — <span className="text-xs text-slate-400">{g.date}</span></p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">O'qituvchi: {recorderName}</p>
                                        </div>
                                        <div className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-xl shadow shrink-0">
                                            {g.score}
                                        </div>
                                        {g.approval_status === 'pending' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleGradeAction(g.id, 'approved')}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === g.id + 'approved' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                    Tasdiqlash
                                                </button>
                                                <button
                                                    onClick={() => handleGradeAction(g.id, 'rejected')}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === g.id + 'rejected' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                    Rad
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )
            ) : (
                filteredAttendance.length === 0 ? (
                    <div className="py-24 flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <Calendar size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Davomatlar yo'q</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredAttendance.map((a, i) => {
                                const studentName = a.profiles?.full_name || a.profiles?.first_name || '—';
                                const recorderName = a.recorder?.full_name || a.recorder?.first_name || '—';
                                return (
                                    <motion.div
                                        key={a.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-black text-slate-900">{studentName}</span>
                                                <span className="text-slate-400 text-xs">•</span>
                                                <span className="text-slate-500 text-sm font-medium">{a.groups?.name}</span>
                                                {STATUS_BADGE[a.approval_status] || STATUS_BADGE.pending}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">{a.date}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">O'qituvchi: {recorderName}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shrink-0 ${ATT_COLOR[a.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {ATT_LABEL[a.status] || a.status}
                                        </span>
                                        {a.approval_status === 'pending' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAttendanceAction(a.id, 'approved')}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === a.id + 'approved' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                    Tasdiqlash
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceAction(a.id, 'rejected')}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === a.id + 'rejected' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                    Rad
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )
            )}
        </div>
    );
};

export default ApprovalCenter;
