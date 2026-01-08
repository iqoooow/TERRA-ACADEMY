import React from 'react';
import { Users, GraduationCap, CreditCard, Activity } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const AdminDashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Total Students', value: '1,240', change: '+12%', icon: GraduationCap, color: 'blue' },
        { title: 'Total Teachers', value: '48', change: '+4%', icon: Users, color: 'purple' },
        { title: 'Revenue (Monthly)', value: '$52,000', change: '+8%', icon: CreditCard, color: 'green' },
        { title: 'Active Groups', value: '36', change: '-2%', icon: Activity, color: 'orange' },
    ];

    const enrollmentData = [
        { name: 'Jan', students: 800 },
        { name: 'Feb', students: 900 },
        { name: 'Mar', students: 1000 },
        { name: 'Apr', students: 1100 },
        { name: 'May', students: 1240 },
        { name: 'Jun', students: 1200 },
    ];

    const financialData = [
        { name: 'Jan', income: 40000 },
        { name: 'Feb', income: 45000 },
        { name: 'Mar', income: 48000 },
        { name: 'Apr', income: 50000 },
        { name: 'May', income: 52000 },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome to Terra Academy Management System</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Growth Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Student Enrollment</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={enrollmentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Financial Overview Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Financial Overview</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
