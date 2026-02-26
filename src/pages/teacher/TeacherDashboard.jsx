import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/ui/StatsCard';
import { Users, BookOpen, Clock, Calendar, TrendingUp, Sparkles, ClipboardCheck, Star, FileText, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 shadow-2xl rounded-2xl p-4 border border-white/10 backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload.fill }}></div>
                        <p className="text-white font-black text-lg tracking-tight">
                            {item.dataKey === 'score' ? `${item.value}% O'zlashtirish` : `${item.value} ta o'quvchi`}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Helper to parse diverse grade formats
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

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');
    const [schedule, setSchedule] = useState([]);
    const [groupStats, setGroupStats] = useState([]);
    const [greeting, setGreeting] = useState('');
    const [upcomingExams, setUpcomingExams] = useState(0);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Xayrli tong');
        else if (hour < 18) setGreeting('Xayrli kun');
        else setGreeting('Xayrli kech');

        fetchTeacherStats();
    }, []);

    const fetchTeacherStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Teacher Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, first_name')
                .eq('id', user.id)
                .single();

            if (profile) setTeacherName(profile.first_name || profile.full_name);

            // 2. Get Groups
            // NOTE: 'room' column is added via PATCH_03. It's safe to include after running the patch.
            const { data: groups, error: groupsError } = await supabase
                .from('groups')
                .select(`
                    id,
                    name,
                    subjects (name),
                    schedule_days,
                    time
                `)
                .eq('teacher_id', user.id);

            if (groupsError) throw groupsError;

            // 3. Calculate Real Stats (Students & Grades)
            let totalStudents = 0;
            let totalScoreSum = 0;
            let groupsWithScore = 0;

            const counts = await Promise.all(
                groups.map(async (group) => {
                    // Count students
                    const { count } = await supabase
                        .from('enrollments')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', group.id);

                    // Calc avg grade
                    const { data: grades } = await supabase
                        .from('grades')
                        .select('score')
                        .eq('group_id', group.id);

                    let gSum = 0;
                    let gCount = 0;
                    (grades || []).forEach(g => {
                        const val = parseScore(g.score);
                        if (val > 0) {
                            gSum += val;
                            gCount++;
                        }
                    });

                    const avg = gCount > 0 ? Math.round(gSum / gCount) : 0; // Default to 0 if no grades

                    if (avg > 0) {
                        totalScoreSum += avg;
                        groupsWithScore++;
                    }

                    return {
                        name: group.name,
                        students: count || 0,
                        score: avg,
                        subject: group.subjects?.name
                    };
                })
            );

            totalStudents = counts.reduce((sum, item) => sum + item.students, 0);
            const globalAverage = groupsWithScore > 0 ? Math.round(totalScoreSum / groupsWithScore) : 0;

            setGroupStats(counts);

            // 4. Get Upcoming Exams Count
            const { count: examCount } = await supabase
                .from('exams')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', user.id)
                .eq('status', 'Upcoming')
                .gte('date', new Date().toISOString().split('T')[0]);

            setUpcomingExams(examCount || 0);

            // 5. Filter Schedule for TODAY
            const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' });
            const todaySchedule = groups
                .filter(g => g.schedule_days && g.schedule_days.includes(todayShort))
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            setSchedule(todaySchedule);

            setStats([
                { title: 'Jami O\'quvchilar', value: totalStudents.toString(), icon: Users, color: 'indigo', change: `+${groupsWithScore}`, trendLabel: "faol guruhlar" },
                { title: 'Jadvaldagi Imtihonlar', value: (examCount || 0).toString(), icon: FileText, color: 'rose', trend: 'Yaqin orada' },
                { title: 'O\'rtacha O\'zlashtirish', value: `${globalAverage}%`, change: globalAverage > 80 ? 'A' : globalAverage > 70 ? 'B' : 'C', icon: Star, color: 'amber', trendLabel: "umumiy reyting" },
            ]);

        } catch (error) {
            console.error('Error fetching teacher stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Premium Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>

                {/* Animated Orbs */}
                <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500/30 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-[-100px] w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]"
                />

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-50 shadow-inner shadow-white/10"
                        >
                            <Sparkles size={12} className="text-yellow-300" />
                            O'qituvchi Kabineti
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">{teacherName || 'Ustoz'}</span>!
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Bugun {schedule.length} ta dars, {upcomingExams} ta yaqinlashayotgan imtihon bor. Kuningiz samarali o'tsin!
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                        <div className="glass-card bg-white/5 border-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-default">
                            <div className="text-3xl font-black text-white">{format(new Date(), 'dd')}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">{format(new Date(), 'MMM', { locale: uz })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {stats.map((stat, i) => (
                    <motion.div key={i} variants={item}>
                        <StatsCard {...stat} idx={i} />
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Today's Schedule (8 cols) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-8 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                                <Calendar size={20} />
                            </span>
                            Bugungi Darslar
                        </h3>
                        {schedule.length > 0 && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide border border-indigo-100">
                                {schedule.length} ta dars
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {schedule.length > 0 ? (
                            schedule.map((slot, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="group flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Decoration Line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Time */}
                                    <div className="flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                                        <Clock size={16} className="text-slate-400 group-hover:text-indigo-500 mb-1" />
                                        <div className="font-black text-slate-800 text-lg group-hover:text-indigo-700">
                                            {slot.time ? slot.time.substring(0, 5) : '--:--'}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-center sm:text-left w-full">
                                        <h4 className="font-black text-slate-900 text-xl group-hover:text-indigo-700 transition-colors mb-2">
                                            {slot.name}
                                        </h4>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wide border border-slate-100">
                                                <BookOpen size={12} className="text-slate-400" />
                                                {slot.subjects?.name}
                                            </span>
                                            {slot.room && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wide border border-orange-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                                    Xona: {slot.room}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => navigate('/teacher/attendance')}
                                            className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 group/btn"
                                        >
                                            <ClipboardCheck size={16} />
                                            <span>Yo'qlama</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <Sparkles className="text-slate-300" size={32} />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-2">Bugun darslar yo'q</h4>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto">
                                    Dam olish kunidan unumli foydalaning yoki keyingi darslarga tayyorgarlik ko'ring.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Group Performance (4 cols) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-4 flex flex-col h-full"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100">
                                <TrendingUp size={20} />
                            </span>
                            Guruh Natijalari
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex-1 flex flex-col min-h-[400px]">
                        {groupStats.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <BarChart2 className="text-slate-300 mb-4" size={40} />
                                <p className="text-slate-400 font-bold">Ma'lumotlar yetarli emas</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={groupStats} layout="vertical" barSize={32} barGap={12}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                            <XAxis type="number" hide domain={[0, 100]} />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={80}
                                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: '#F8FAFC', radius: 8 }}
                                            />
                                            <Bar dataKey="score" radius={[0, 8, 8, 0]} animationDuration={1500} background={{ fill: '#F8FAFC', radius: [0, 8, 8, 0] }}>
                                                {groupStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.score > 85 ? '#8B5CF6' : entry.score > 70 ? '#6366F1' : '#F59E0B'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eng faol guruh</span>
                                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> Top 1
                                        </span>
                                    </div>
                                    {groupStats.length > 0 && (
                                        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 flex items-center justify-between">
                                            <span className="font-bold text-slate-800 text-sm">
                                                {groupStats.reduce((prev, current) => (prev.score > current.score) ? prev : current, { name: '—' }).name}
                                            </span>
                                            <span className="font-black text-purple-600 text-lg">
                                                {groupStats.length > 0 ? Math.max(...groupStats.map(g => g.score)) : 0}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Davomat olish', icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100', path: '/teacher/attendance' },
                    { label: 'Baho qo\'yish', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100', path: '/teacher/grades' },
                    { label: 'Guruhlar', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', path: '/teacher/groups' },
                    { label: 'Imtihonlar', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100', path: '/teacher/exams' },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className={`p-4 rounded-2xl border border-transparent transition-all duration-300 flex items-center justify-center gap-3 group ${action.bg}`}
                    >
                        <span className={`p-2 bg-white rounded-lg shadow-sm ${action.color}`}>
                            <action.icon size={20} />
                        </span>
                        <span className="font-bold text-slate-700 text-sm">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TeacherDashboard;
