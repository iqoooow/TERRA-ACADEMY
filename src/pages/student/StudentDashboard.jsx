import { useState, useEffect } from 'react';
import { BookOpen, Trophy, Calendar, TrendingUp, Star, ChevronRight, Zap, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StatsCard from '../../components/ui/StatsCard';
import toast from 'react-hot-toast';
import { parseScore } from '../../utils/parseScore';
import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 shadow-2xl rounded-2xl p-4 border border-white/10 backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{payload[0].name}</p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></div>
                    <p className="text-white font-black text-lg tracking-tight">
                        {payload[0].value}% O'zlashtirish
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const StudentDashboard = () => {
    const [stats, setStats] = useState([]);
    const [studentName, setStudentName] = useState('');
    const [, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [averageScore, setAverageScore] = useState(0);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Xayrli tong');
        else if (hour < 18) setGreeting('Xayrli kun');
        else setGreeting('Xayrli kech');

        fetchStudentStats();
    }, []);

    const fetchStudentStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Profile
            const { data: profile } = await supabase.from('profiles').select('full_name, first_name').eq('id', user.id).single();
            if (profile) setStudentName(profile.first_name || profile.full_name);

            // 2. Get Enrollments (Groups)
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('group_id, groups(id, name, subjects(name))')
                .eq('student_id', user.id);

            const groupIds = enrollments?.map(e => e.group_id) || [];
            const courseCount = groupIds.length;

            // 3. Get Real Exams for these groups
            let formattedExams = [];
            if (groupIds.length > 0) {
                const { data: exams } = await supabase
                    .from('exams')
                    .select('title, date, time, room, type, group_id, groups(subjects(name))')
                    .in('group_id', groupIds)
                    .eq('status', 'Upcoming')
                    .gte('date', new Date().toISOString().split('T')[0])
                    .order('date', { ascending: true })
                    .limit(3);

                formattedExams = (exams || []).map(e => ({
                    title: e.title,
                    date: new Date(e.date),
                    time: e.time ? e.time.slice(0, 5) : '09:00',
                    room: e.room || "Ko'rsatilmagan",
                    type: e.type || 'Exam',
                    subject: e.groups?.subjects?.name || "Noma'lum"
                }));
                setUpcomingExams(formattedExams);
            }

            // 4. Get Real Grades per Subject
            // Declare outside the if block so setStats below can always reference them
            let totalSum = 0;
            let totalCount = 0;

            if (groupIds.length > 0) {
                const { data: grades } = await supabase
                    .from('grades')
                    .select('score, group_id')
                    .eq('student_id', user.id);

                // Group by group_id (Subject)
                const subjectScores = {};
                (grades || []).forEach(g => {
                    const gid = g.group_id;
                    const val = parseScore(g.score);
                    if (val > 0) {
                        if (!subjectScores[gid]) subjectScores[gid] = { sum: 0, count: 0 };
                        subjectScores[gid].sum += val;
                        subjectScores[gid].count++;
                    }
                });

                const chartData = [];
                const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

                enrollments.forEach((e, idx) => {
                    const gid = e.group_id;
                    const meta = subjectScores[gid];
                    if (meta) {
                        const avg = Math.round(meta.sum / meta.count);
                        chartData.push({
                            name: e.groups?.subjects?.name || e.groups?.name,
                            uv: avg,
                            fill: colors[idx % colors.length]
                        });
                        totalSum += avg;
                        totalCount++;
                    }
                });

                setProgressData(chartData);
                setAverageScore(totalCount > 0 ? Math.round(totalSum / totalCount) : 0);
            }

            // 5. Stats
            setStats([
                { title: 'O\'rtacha Baho', value: totalCount > 0 ? Math.round(totalSum / totalCount).toString() + '%' : '—', icon: Trophy, color: 'amber', trendLabel: "joriy holat" },
                { title: 'Faol Kurslar', value: (courseCount || 0).toString(), icon: BookOpen, color: 'blue', trendLabel: "joriy o'quv yili" },
                { title: 'Yaqin Imtihonlar', value: formattedExams.length.toString(), icon: Calendar, color: 'purple', trendLabel: "rejalashtirilgan" },
            ]);

        } catch (error) {
            console.error('Error fetching student stats:', error);
            toast.error("Ma'lumotlarni yuklashda xatolik");
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
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-lg">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900"></div>
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-400/10 rounded-full blur-[70px] pointer-events-none" />

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-cyan-200 shadow-inner shadow-white/10"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            O'quvchi Kabineti
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-100">{studentName || 'Talaba'}</span>!
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Bugun yangi bilimlarni egallash uchun ajoyib kun. Olg'a!
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                        <div className="glass-card bg-white/5 border-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-default group/date">
                            <div className="text-3xl font-black text-white group-hover/date:scale-110 transition-transform">{format(new Date(), 'dd')}</div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Tasks (2 Cols) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-slate-100 bg-white/80 backdrop-blur-xl shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                                    <Calendar size={20} />
                                </span>
                                Yaqin Imtihonlar
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {upcomingExams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Star className="text-slate-300" size={24} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">Imtihonlar yo'q</h4>
                                <p className="text-slate-500 text-sm">Hozircha yaqin orada hech qanday imtihon rejalashtirilmagan.</p>
                            </div>
                        ) : (
                            upcomingExams.map((exam, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.01 }}
                                    className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex flex-col items-center justify-center min-w-[80px] p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">{format(exam.date, 'MMM')}</span>
                                        <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-700">{format(exam.date, 'dd')}</span>
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${exam.type === 'Exam' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {exam.type}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {exam.time}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">{exam.title}</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{exam.subject} • Xona {exam.room}</p>
                                    </div>

                                    <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:scale-110">
                                        <ChevronRight size={20} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Progress Chart (1 Col) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-8 flex flex-col rounded-[2.5rem] border border-slate-100 bg-white/80 backdrop-blur-xl shadow-sm"
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                                <TrendingUp size={20} />
                            </span>
                            Natijalar
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 ml-1">Fanlar bo'yicha o'zlashtirish</p>
                    </div>

                    <div className="flex-1 min-h-[300px] relative">
                        {progressData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Trophy className="text-slate-300" size={24} />
                                </div>
                                <p className="text-slate-500 font-medium">Baholar hali yo'q</p>
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="30%" outerRadius="100%" barSize={16} data={progressData} startAngle={90} endAngle={-270}>
                                        <RadialBar
                                            background={{ fill: '#F1F5F9' }}
                                            dataKey="uv"
                                            cornerRadius={10}
                                        />
                                        <Legend
                                            iconSize={8}
                                            layout="vertical"
                                            verticalAlign="middle"
                                            wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)', fontWeight: 700, fontSize: '12px', color: '#64748B' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={false} />
                                    </RadialBarChart>
                                </ResponsiveContainer>

                                {/* Center Value */}
                                <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{averageScore}%</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">O'rtacha</div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default StudentDashboard;
