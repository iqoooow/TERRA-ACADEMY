import { useState, useEffect, useMemo } from 'react';
import { Check, X, Clock, Loader2, FileText, Users, Search, Calendar, Zap, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';
import StatsCard from '../../../components/ui/StatsCard';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import toast from 'react-hot-toast';

const statusLabel = { present: "Keldi", absent: "Kelmadi", late: "Kechikdi" };
const statusBadge = {
    present: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    absent: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20',
    late: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
};

// Static class maps — Tailwind requires full class names to be statically present
const badgeWrapClass = {
    emerald: 'px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3',
    rose: 'px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3',
    amber: 'px-4 py-2 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3',
};
const badgeDotClass = {
    emerald: 'w-2 h-2 rounded-full bg-emerald-500',
    rose: 'w-2 h-2 rounded-full bg-rose-500',
    amber: 'w-2 h-2 rounded-full bg-amber-500',
};
const badgeTextClass = {
    emerald: 'text-[10px] font-black text-emerald-700 uppercase tracking-widest',
    rose: 'text-[10px] font-black text-rose-700 uppercase tracking-widest',
    amber: 'text-[10px] font-black text-amber-700 uppercase tracking-widest',
};

const AttendanceList = () => {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!date) {
            setReport([]);
            return;
        }
        const fetchReport = async () => {
            setLoading(true);
            try {
                const { data: att, error } = await supabase
                    .from('attendance')
                    .select(`
                        student_id,
                        group_id,
                        status,
                        profiles!student_id (full_name, first_name, last_name, email),
                        groups (id, name, subjects (name))
                    `)
                    .eq('date', date)
                    .order('group_id');

                if (error) throw error;

                const byGroup = {};
                (att || []).forEach((row) => {
                    const gid = row.group_id;
                    if (!byGroup[gid]) {
                        byGroup[gid] = {
                            id: gid,
                            name: row.groups?.name || '—',
                            subject: row.groups?.subjects?.name || "Noma'lum",
                            students: [],
                        };
                    }
                    const p = row.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    byGroup[gid].students.push({
                        student_id: row.student_id,
                        name,
                        email: p?.email,
                        status: row.status
                    });
                });

                setReport(Object.values(byGroup).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            } catch (err) {
                console.error('Error fetching attendance report:', err);
                toast.error("Davomat ma'lumotlarini yuklashda xatolik");
                setReport([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [date]);

    const filteredReport = useMemo(() => {
        if (!searchQuery.trim()) return report;
        const q = searchQuery.trim().toLowerCase();
        return report
            .map((g) => ({
                ...g,
                students: g.students.filter((s) =>
                    (s.name || '').toLowerCase().includes(q) || (g.name || '').toLowerCase().includes(q)
                ),
            }))
            .filter((g) => g.students.length > 0);
    }, [report, searchQuery]);

    const total = filteredReport.reduce((acc, g) => acc + g.students.length, 0);
    const presentCount = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'present').length, 0);
    const absentCount = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'absent').length, 0);
    const lateCount = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'late').length, 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-blue-200 shadow-inner"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            Davomat Intellekti
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                            Tizim <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Hisoboti</span>
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl">
                            {date} kuni bo'yicha akademiya davomati va faollik tahlili.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">Sanalarni Filtrlash</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-2xl text-white py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 backdrop-blur-md font-bold transition-all hover:bg-white/20 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <StatsCard title="Umumiy O'quvchilar" value={total} icon={Users} color="blue" />
                <StatsCard title="Darsda Borlar" value={presentCount} icon={Check} color="emerald" trend="+12%" />
                <StatsCard title="Kelmaganlar" value={absentCount} icon={X} color="rose" trend="-5%" />
                <StatsCard title="Kechikkanlar" value={lateCount} icon={Clock} color="amber" trend="2.4%" />
            </motion.div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Guruh yoki o'quvchi bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20">
                        <FileText size={16} />
                        Export PDF
                    </button>
                    <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        <ClipboardCheck size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Ma'lumotlar yuklanmoqda...</p>
                </div>
            ) : filteredReport.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-20 text-center flex flex-col items-center justify-center"
                >
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <FileText size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 italic">Hisobot topilmadi</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                        {date} kuni uchun hech qanday davomat yozuvi kiritilmagan yoki qidiruvga mos natija yo'q.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-8"
                >
                    {filteredReport.map((group) => (
                        <motion.div
                            key={group.id}
                            variants={itemVariants}
                            className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden group/card"
                        >
                            <div className="px-10 py-8 bg-gradient-to-r from-slate-50/50 to-white flex flex-wrap items-center justify-between gap-6 border-b border-slate-50">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex flex-col items-center justify-center text-white shadow-xl shadow-slate-900/20 shrink-0 group-hover/card:scale-110 transition-transform duration-500">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{group.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-100">{group.subject}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">• {group.students.length} O'quvchi</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {[
                                        { label: 'Keldi', count: group.students.filter(s => s.status === 'present').length, color: 'emerald' },
                                        { label: 'Kelmadi', count: group.students.filter(s => s.status === 'absent').length, color: 'rose' },
                                        { label: 'Kechikdi', count: group.students.filter(s => s.status === 'late').length, color: 'amber' }
                                    ].map((badge) => (
                                        <div key={badge.label} className={badgeWrapClass[badge.color]}>
                                            <div className={badgeDotClass[badge.color]}></div>
                                            <span className={badgeTextClass[badge.color]}>{badge.count} {badge.label}</span>
                                        </div>
                                    ))}
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-2">
                                <Table headers={['Student ID', 'O\'quvchi F.I.O', 'Status Signali', 'Vaqt / Qaydlari']}>
                                    {group.students.map((s) => (
                                        <TableRow key={s.student_id} className="hover:!bg-slate-50/50">
                                            <TableCell>
                                                <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">ID-{s.student_id.substring(0, 8)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shadow-inner uppercase">
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight text-sm">{s.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium lowercase italic">{s.email || 'bog\'lanmagan'}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${s.status === 'present' ? 'bg-emerald-500' : s.status === 'late' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge[s.status]}`}>
                                                        {statusLabel[s.status] || s.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black italic uppercase tracking-widest">
                                                    <Clock size={12} />
                                                    Avtomatik qayd
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default AttendanceList;

