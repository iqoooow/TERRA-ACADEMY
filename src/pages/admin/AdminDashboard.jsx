import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, CreditCard, Activity, ArrowUpRight, Filter, Download } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import { supabase } from '../../lib/supabase';
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

const AdminDashboard = () => {
    const [stats, setStats] = useState([
        { title: "O'quvchilar", value: '0', change: '...', icon: GraduationCap, color: 'blue' },
        { title: "O'qituvchilar", value: '0', change: '...', icon: Users, color: 'purple' },
        { title: 'Tushum (Oy)', value: '0', change: '...', icon: CreditCard, color: 'green' },
        { title: 'Guruhlar', value: '0', change: '...', icon: Activity, color: 'orange' },
    ]);
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [financialData, setFinancialData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Counts
                const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
                const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
                const { count: groupCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });

                // 2. Fetch Financials (Current Month)
                const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
                const { data: currentMonthPayments } = await supabase
                    .from('monthly_payments')
                    .select('paid_amount')
                    .eq('payment_month', currentMonthStart)
                    .eq('status', 'paid');

                const currentRevenue = currentMonthPayments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;

                setStats([
                    { title: "O'quvchilar", value: studentCount || 0, change: 'Faol', icon: GraduationCap, color: 'blue' },
                    { title: "O'qituvchilar", value: teacherCount || 0, change: 'Faol', icon: Users, color: 'purple' },
                    { title: 'Tushum (Bu oy)', value: `${currentRevenue.toLocaleString()} UZS`, change: format(new Date(), 'MMMM', { locale: uz }), icon: CreditCard, color: 'green' },
                    { title: 'Guruhlar', value: groupCount || 0, change: 'Faol', icon: Activity, color: 'orange' },
                ]);

                // 3. Prepare Chart Data (Last 6 Months)
                const months = [];
                for (let i = 5; i >= 0; i--) {
                    const d = subMonths(new Date(), i);
                    months.push(d);
                }

                // Parallel fetch for chart data (Optimized)
                const chartPromises = months.map(async (date) => {
                    const monthStart = format(startOfMonth(date), 'yyyy-MM-dd');
                    const monthName = format(date, 'MMM', { locale: uz });

                    // Enrollment (New students in that month)
                    const { count: newStudents } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('role', 'student')
                        .gte('created_at', format(startOfMonth(date), "yyyy-MM-dd'T'00:00:00"))
                        .lte('created_at', format(endOfMonth(date), "yyyy-MM-dd'T'23:59:59"));

                    // Revenue
                    const { data: payments } = await supabase
                        .from('monthly_payments')
                        .select('paid_amount')
                        .eq('payment_month', monthStart)
                        .eq('status', 'paid');

                    const revenue = payments?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;

                    return {
                        name: monthName,
                        students: newStudents || 0, // Should ideally be total active, but new students is easier to query efficiently without time-series snapshot table
                        income: revenue
                    };
                });

                const chartData = await Promise.all(chartPromises);

                setEnrollmentData(chartData);
                setFinancialData(chartData);

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-black text-slate-900 tracking-tight"
                    >
                        Xush kelibsiz, Admin! 👋
                    </motion.h1>
                    <p className="text-slate-500 font-medium">Terra Academy bugungi holati va statistikasi</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} idx={index} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 border border-slate-100 bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Yangi O'quvchilar</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Oxirgi 6 oy</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={enrollmentData}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(226, 232, 240, 0.5)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Financial Overview Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6 border border-slate-100 bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Moliyaviy ko'rsatkichlar</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daromad tahlili</p>
                        </div>
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                            <ArrowUpRight size={20} />
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(226, 232, 240, 0.5)',
                                    }}
                                />
                                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
