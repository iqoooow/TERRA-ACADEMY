import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, CreditCard, Activity, Download, Calendar, UserPlus, DollarSign, Plus, Shield, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { uz } from 'date-fns/locale';

// Custom bar shape: reads `fill` from the data payload, replaces deprecated <Cell>
const ColoredBar = ({ x, y, width, height, fill }) => {
    if (!width || height <= 0) return null;
    return <rect x={x} y={y} rx={6} ry={6} width={width} height={height} fill={fill || '#D1FAE5'} />;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { title: "O'quvchilar", value: '...', change: '...', icon: GraduationCap, color: 'blue' },
        { title: "O'qituvchilar", value: '...', change: '...', icon: Users, color: 'purple' },
        { title: 'Tushum (Oy)', value: '...', change: '...', icon: CreditCard, color: 'green' },
        { title: 'Guruhlar', value: '...', change: '...', icon: Activity, color: 'orange' },
    ]);
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [financialData, setFinancialData] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Counts
            const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
            const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
            const { count: groupCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });

            // 2. Fetch Financials (Current Month) — from payment_transactions
            const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

            const { data: currentMonthTxs } = await supabase
                .from('payment_transactions')
                .select('amount')
                .gte('created_at', `${currentMonthStart}T00:00:00`)
                .lte('created_at', `${currentMonthEnd}T23:59:59`);

            const currentRevenue = (currentMonthTxs || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

            setStats([
                { title: "Jami O'quvchilar", value: studentCount || 0, icon: GraduationCap, color: 'indigo', trendLabel: "tizimda ro'yxatdan o'tgan" },
                { title: "O'qituvchilar", value: teacherCount || 0, icon: Users, color: 'violet', trendLabel: "faol o'qituvchilar" },
                { title: 'Joriy Tushum', value: `${(currentRevenue / 1000000).toFixed(1)}M`, change: format(new Date(), 'MMMM', { locale: uz }), icon: CreditCard, color: 'emerald', trendLabel: "oylik hisobot" },
                { title: 'Faol Guruhlar', value: groupCount || 0, icon: Activity, color: 'amber', trendLabel: "jami guruhlar" },
            ]);

            // 3. Prepare Chart Data (Last 6 Months)
            const months = [];
            for (let i = 5; i >= 0; i--) {
                months.push(subMonths(new Date(), i));
            }

            // Parallel fetch for chart data — payment_transactions (correct table)
            const chartPromises = months.map(async (date) => {
                const monthStart = format(startOfMonth(date), "yyyy-MM-dd'T'00:00:00");
                const monthEnd = format(endOfMonth(date), "yyyy-MM-dd'T'23:59:59");
                const monthName = format(date, 'MMM', { locale: uz });

                // New students registered in that month
                const { count: newStudents } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'student')
                    .gte('created_at', monthStart)
                    .lte('created_at', monthEnd);

                // Revenue from payment_transactions
                const { data: txs } = await supabase
                    .from('payment_transactions')
                    .select('amount')
                    .gte('created_at', monthStart)
                    .lte('created_at', monthEnd);

                const revenue = (txs || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

                return {
                    name: monthName,
                    students: newStudents || 0,
                    income: revenue,
                    displayIncome: (revenue / 1000000).toFixed(1)
                };
            });

            const chartData = await Promise.all(chartPromises);
            // Bake per-bar fill into data so ColoredBar shape can read it (replaces deprecated Cell)
            const coloredChartData = chartData.map((d, i) => ({
                ...d,
                fill: i === chartData.length - 1 ? '#10B981' : '#D1FAE5'
            }));
            setEnrollmentData(coloredChartData);
            setFinancialData(coloredChartData);

            // 4. Recent Activity (New Users)
            const { data: newUsers } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentUsers(newUsers || []);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error("Dashboard ma'lumotlarini yuklashda xatolik");
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
        <div className="space-y-8 animate-fade-in pb-10 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>

                {/* Animated Orbs */}
                <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px]"
                />

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-100 shadow-inner shadow-white/10"
                        >
                            <Shield size={12} className="text-emerald-400" />
                            Administrator Paneli
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                            Xush kelibsiz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Admin!</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-xl leading-relaxed">
                            Bugungi kunda tizimda{' '}
                            {stats[0].value === '...' ? 'yuklanmoqda...' : `${stats[0].value} tadan ortiq faol foydalanuvchi`} mavjud.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="glass-card bg-white/5 border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Bugun</div>
                                <div className="font-black text-white">{format(new Date(), 'dd MMMM', { locale: uz })}</div>
                            </div>
                        </div>
                        <button className="btn-primary from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center gap-2 px-6 rounded-2xl">
                            <Download size={20} />
                            <span className="hidden sm:inline font-bold uppercase tracking-wide text-xs">Hisobot</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Yangi O'quvchi", icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', path: '/admin/registration-requests' },
                    { label: 'Guruh Yaratish', icon: Plus, color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100', path: '/admin/groups' },
                    { label: "To'lov Qabul Qilish", icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100', path: '/admin/finance' },
                    { label: "O'quvchilar Ro'yxati", icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 hover:bg-indigo-100', path: '/admin/students' },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className={`p-4 rounded-2xl border border-transparent transition-all duration-300 flex items-center justify-center gap-3 group active:scale-95 ${action.bg}`}
                    >
                        <span className={`p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform ${action.color}`}>
                            <action.icon size={20} strokeWidth={2.5} />
                        </span>
                        <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat, index) => (
                    <motion.div key={index} variants={item}>
                        <StatsCard {...stat} idx={index} loading={loading} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Student Growth Chart - Takes 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card p-8 border border-slate-100 bg-white shadow-xl shadow-slate-200/50 rounded-[2.5rem]"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </span>
                                O'quvchilar O'sishi
                            </h3>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wide">
                            So'nggi 6 oy
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={350} debounce={50}>
                            <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        borderRadius: '16px',
                                        border: 'none',
                                        padding: '12px 16px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                                    formatter={(value) => [`${value} ta`, 'Yangi o\'quvchilar']}
                                    cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Financial Overview - Takes 1 col */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-8 border border-slate-100 bg-white shadow-xl shadow-slate-200/50 rounded-[2.5rem] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={20} />
                                </span>
                                Moliya
                            </h3>
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={320} debounce={50}>
                            <BarChart data={financialData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ fill: '#F0FDF4', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: '#10B981',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff', opacity: 0.8 }}
                                    formatter={(value) => [`${value} mln`, 'Tushum']}
                                />
                                <Bar dataKey="displayIncome" barSize={20} animationDuration={2000} shape={<ColoredBar />} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
                <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Activity size={20} />
                        </span>
                        So'nggi Faollik
                    </h3>
                    <div className="space-y-4">
                        {recentUsers.map((user, i) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform ${user.role === 'student' ? 'bg-blue-100 text-blue-600' :
                                    user.role === 'teacher' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {user.first_name ? user.first_name.charAt(0) : '?'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.full_name || 'Noma\'lum F.'}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <span>{user.role === 'student' ? 'O\'quvchi' : user.role === 'teacher' ? 'O\'qituvchi' : user.role}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {format(new Date(user.created_at), 'dd MMM, HH:mm')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    {user.status === 'approved' ? (
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl" title="Tasdiqlangan">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    ) : user.status === 'pending' ? (
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl" title="Kutilmoqda">
                                            <Clock size={18} />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl" title="Rad etilgan">
                                            <AlertTriangle size={18} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden flex flex-col justify-center items-center text-center shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>

                    <div className="relative z-10">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-20 h-20 bg-white/10 rounded-3xl mx-auto mb-8 flex items-center justify-center backdrop-blur-md shadow-inner shadow-white/20 border border-white/10"
                        >
                            <Download size={36} className="text-blue-300" />
                        </motion.div>
                        <h3 className="text-3xl font-black mb-3">Tizim Yangilanishlari</h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                            Yangi versiya funksiyalari va xavfsizlik yangilanishlari haqida to'liq ma'lumot olish uchun bosing.
                        </p>
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1">
                            Batafsil O'qish
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
