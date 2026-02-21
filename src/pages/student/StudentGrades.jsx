import { useState, useEffect } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
    cefr: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    ielts: 'text-rose-600 bg-rose-50 border-rose-100',
    test: 'text-blue-600 bg-blue-50 border-blue-100',
    exam: 'text-purple-600 bg-purple-50 border-purple-100',
    quiz: 'text-amber-600 bg-amber-50 border-amber-100',
    homework: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    other: 'text-slate-600 bg-slate-50 border-slate-100',
};

const parseScore = (scoreStr) => {
    if (!scoreStr) return 0;
    const s = scoreStr.toString().toUpperCase().trim();
    if (s === 'A1') return 30;
    if (s === 'A2') return 50;
    if (s === 'B1') return 65;
    if (s === 'B2') return 75;
    if (s === 'C1') return 85;
    if (s === 'C2') return 95;
    const num = parseFloat(s);
    if (!isNaN(num)) {
        if (num <= 10) return num * 10;
        if (num <= 100) return num;
    }
    return 0;
};

const StudentGrades = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');

    useEffect(() => {
        if (user?.id) fetchGrades();
    }, [user?.id]);

    const fetchGrades = async () => {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select(`
                    id, title, score, grade_type, date,
                    groups (id, name, subjects(name))
                `)
                .eq('student_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            const formattedGrades = (data || []).map(g => ({
                id: g.id,
                title: g.title,
                score: g.score,
                type: g.grade_type || 'other',
                date: g.date,
                subject: g.groups?.subjects?.name || g.groups?.name || 'General',
                groupName: g.groups?.name
            }));

            // Calculate Subject Averages
            const subjectMap = {};
            formattedGrades.forEach(g => {
                const sub = g.subject;
                if (!subjectMap[sub]) {
                    subjectMap[sub] = { name: sub, total: 0, count: 0, items: [] };
                }
                const val = parseScore(g.score);
                if (val > 0) {
                    subjectMap[sub].total += val;
                    subjectMap[sub].count++;
                }
                subjectMap[sub].items.push(g);
            });

            const statsArray = Object.values(subjectMap).map(s => ({
                name: s.name,
                average: s.count > 0 ? Math.round(s.total / s.count) : 0,
                count: s.items.length
            }));

            setGrades(formattedGrades);
            setStats(statsArray);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredGrades = selectedSubject === 'All'
        ? grades
        : grades.filter(g => g.subject === selectedSubject);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { y: 10, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-purple-300"
                    >
                        <GraduationCap size={12} />
                        Akademik Natijalar
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Mening Baholarim
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Barcha fanlar bo'yicha o'zlashtirish ko'rsatkichlaringiz va reytingingiz.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            ) : grades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <GraduationCap className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Baholar topilmadi</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-6">Hozircha tizimda baholar mavjud emas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Fanlar Kesimi</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedSubject('All')}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedSubject === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="font-bold text-sm">Barcha Fanlar</span>
                                    <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-lg">{grades.length}</span>
                                </button>
                                {stats.map(s => (
                                    <button
                                        key={s.name}
                                        onClick={() => setSelectedSubject(s.name)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedSubject === s.name ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{s.name}</div>
                                            <div className="text-[10px] font-medium opacity-70">{s.count} ta baho</div>
                                        </div>
                                        <div className={`text-sm font-black ${s.average >= 80 ? 'text-emerald-400' : s.average >= 60 ? 'text-amber-400' : 'text-rose-400'} ${selectedSubject === s.name ? '!text-white' : ''}`}>
                                            {s.average}%
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-purple-500/30 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <h3 className="relative z-10 text-sm font-bold text-purple-200 uppercase tracking-widest mb-1">Umumiy O'rtacha</h3>
                            <div className="relative z-10 text-5xl font-black mb-2">
                                {Math.round(stats.reduce((acc, curr) => acc + curr.average, 0) / (stats.length || 1))}%
                            </div>
                            <p className="relative z-10 text-sm font-medium text-purple-100">Joriy o'zlashtirish darajasi</p>
                        </div>
                    </div>

                    {/* Grades List */}
                    <div className="lg:col-span-3">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-4"
                        >
                            <AnimatePresence mode='wait'>
                                {filteredGrades.map((g) => (
                                    <motion.div
                                        key={g.id}
                                        variants={item}
                                        layout
                                        className="group bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-purple-100 shadow-sm hover:shadow-lg hover:shadow-purple-500/5 transition-all flex flex-col sm:flex-row items-center gap-6"
                                    >
                                        {/* Date */}
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors shrink-0">
                                            <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-purple-400">
                                                {g.date ? new Date(g.date).toLocaleDateString('en-US', { month: 'short' }) : '---'}
                                            </span>
                                            <span className="text-xl font-black text-slate-700 group-hover:text-purple-600">
                                                {g.date ? new Date(g.date).getDate() : '--'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-center sm:text-left min-w-0">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{g.subject}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${TYPE_COLORS[g.type?.toLowerCase()] || TYPE_COLORS.other}`}>
                                                    {g.type}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                                                {g.title}
                                            </h4>
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Natija</div>
                                            </div>
                                            <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xl shadow-lg shadow-slate-900/10 min-w-[80px] text-center">
                                                {g.score}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentGrades;
