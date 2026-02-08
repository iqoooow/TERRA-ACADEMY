import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, CreditCard, Activity, Calendar, ArrowUpRight, Filter, Download } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import { supabase } from '../../lib/supabase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const [stats, setStats] = useState([
        { title: "O'quvchilar", value: '...', change: '+12%', icon: GraduationCap, color: 'blue' },
        { title: "O'qituvchilar", value: '...', change: '+2%', icon: Users, color: 'purple' },
        { title: 'Tushum', value: '...', change: '+8%', icon: CreditCard, color: 'green' },
        { title: 'Guruhlar', value: '...', change: '+5%', icon: Activity, color: 'orange' },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { count: studentCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'student');

                const { count: teacherCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'teacher');

                const { count: groupCount } = await supabase
                    .from('groups')
                    .select('*', { count: 'exact', head: true });

                const { data: payments } = await supabase
                    .from('payments')
                    .select('amount')
                    .eq('status', 'paid');

                const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

                setStats([
                    { title: "O'quvchilar", value: studentCount || 0, change: '+12%', icon: GraduationCap, color: 'blue' },
                    { title: "O'qituvchilar", value: teacherCount || 0, change: '+2%', icon: Users, color: 'purple' },
                    { title: 'Tushum', value: `${totalRevenue.toLocaleString()} UZS`, change: '+8%', icon: CreditCard, color: 'green' },
                    { title: 'Guruhlar', value: groupCount || 0, change: '+5%', icon: Activity, color: 'orange' },
                ]);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const enrollmentData = [
        { name: 'Yan', students: 400 },
        { name: 'Feb', students: 520 },
        { name: 'Mar', students: 680 },
        { name: 'Apr', students: 750 },
        { name: 'May', students: 840 },
        { name: 'Iyun', students: 920 },
    ];

    const financialData = [
        { name: 'Yan', income: 40000 },
        { name: 'Feb', income: 45000 },
        { name: 'Mar', income: 48000 },
        { name: 'Apr', income: 50000 },
        { name: 'May', income: 52000 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
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
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95">
                        <Download size={18} />
                        Hisobot yuklash
                    </button>
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
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">O'quvchilar o'sishi</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Oxirgi 6 oy bo'yicha</p>
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
                    className="glass-card p-6"
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
