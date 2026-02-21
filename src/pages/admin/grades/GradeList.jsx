import { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Search, Loader2, Trophy, Target, Star, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from '../../../components/ui/StatsCard';
import EmptyState from '../../../components/ui/EmptyState';

const TYPE_LABELS = { cefr: 'CEFR', ielts: 'IELTS', test: 'Test', exam: 'Imtihon', quiz: 'Quiz', homework: 'Uy vazifasi', other: 'Boshqa' };

const GradeList = () => {
    const [grades, setGrades] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupFilter, setGroupFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const [gRes, grRes] = await Promise.all([
                supabase.from('groups').select('id, name').order('name'),
                supabase
                    .from('grades')
                    .select(`
                        id, student_id, group_id, title, score, grade_type, date,
                        profiles!student_id (full_name, first_name, last_name, email),
                        groups (id, name)
                    `)
                    .order('date', { ascending: false }),
            ]);
            if (gRes.error) throw gRes.error;
            setGroups(gRes.data || []);
            if (grRes.error) throw grRes.error;
            const rows = (grRes.data || []).map((r) => {
                const p = r.profiles;
                const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                return { ...r, studentName: name, groupName: r.groups?.name || '—', email: p?.email };
            });
            setGrades(rows);
        } catch (e) {
            console.error(e);
            setGrades([]);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const filtered = useMemo(() => {
        let list = grades;
        if (groupFilter) list = list.filter((g) => g.group_id === groupFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(
                (g) =>
                    (g.studentName || '').toLowerCase().includes(q) ||
                    (g.title || '').toLowerCase().includes(q) ||
                    (g.groupName || '').toLowerCase().includes(q) ||
                    String(g.score || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [grades, groupFilter, searchQuery]);

    const averageGrade = useMemo(() => {
        if (filtered.length === 0) return 0;
        const sum = filtered.reduce((acc, g) => acc + (parseFloat(g.score) || 0), 0);
        return (sum / filtered.length).toFixed(1);
    }, [filtered]);

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Academic Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-purple-200 shadow-inner"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            Akademik Monitoring
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                            Baholar <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-violet-100">Jurnali</span>
                        </h1>
                        <p className="text-purple-100/80 font-medium text-lg max-w-xl">
                            Akademiya bo'yicha barcha o'zlashtirish ko'rsatkichlari va natijalar markazi.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <label className="text-[10px] font-black text-purple-200 uppercase tracking-[0.2em]">Guruhlarni Filtrlash</label>
                        <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-2xl text-white py-3.5 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 backdrop-blur-md font-bold transition-all hover:bg-white/20 cursor-pointer min-w-[240px] appearance-none"
                        >
                            <option value="" className="bg-slate-900">Barcha guruhlar</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="O'rtacha Ball" value={averageGrade} icon={Trophy} color="purple" trend="+2.4%" />
                <StatsCard title="Jami Baholar" value={filtered.length} icon={Target} color="blue" />
                <StatsCard title="A'lochi Talabalar" value={filtered.filter(g => parseFloat(g.score) >= 90).length} icon={Star} color="amber" />
                <StatsCard title="Imtihonlar" value={filtered.filter(g => g.grade_type === 'exam').length} icon={GraduationCap} color="rose" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="O'quvchi, guruh yoki topshiriq bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button
                        onClick={fetchGrades}
                        disabled={loading}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95">
                        <ArrowUpRight size={16} />
                        Analytics
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Baholar yuklanmoqda...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Baholar topilmadi"
                    description={searchQuery ? `"${searchQuery}" bo'yicha hech qanday baxo topilmadi.` : "Hozircha baholar jurnali bo'sh."}
                />
            ) : (
                <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-2 overflow-hidden">
                    <Table headers={['Guruh', 'O\'quvchi F.I.O', 'Topshiriq Turi', 'Pristij Ball', 'Sana']}>
                        {filtered.map((r) => (
                            <TableRow key={r.id} className="group/row">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-purple-500 rounded-full group-hover/row:scale-y-125 transition-transform"></div>
                                        <span className="font-black text-slate-900 tracking-tight uppercase text-xs">{r.groupName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shadow-inner uppercase">
                                            {r.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight text-sm">{r.studentName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium lowercase italic">{r.email || 'bog\'lanmagan'}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-black text-slate-800 text-xs uppercase tracking-wider">{r.title}</div>
                                        <div className="mt-1">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200">
                                                {TYPE_LABELS[r.grade_type] || r.grade_type}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="relative inline-block">
                                        <div className={`px-4 py-2 rounded-2xl font-black text-sm shadow-lg ${parseFloat(r.score) >= 90 ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                            parseFloat(r.score) >= 70 ? 'bg-blue-500 text-white shadow-blue-500/20' :
                                                'bg-rose-500 text-white shadow-rose-500/20'
                                            }`}>
                                            {r.score}{typeof r.score === 'number' || !isNaN(r.score) ? '%' : ''}
                                        </div>
                                        {parseFloat(r.score) >= 90 && (
                                            <div className="absolute -top-1 -right-1">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                                            {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('uz-UZ') : '—'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-300 italic mt-1 uppercase">Tizim orqali</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}
        </div>
    );
};

export default GradeList;

