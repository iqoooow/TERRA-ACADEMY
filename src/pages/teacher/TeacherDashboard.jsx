import React from 'react';
import StatsCard from '../../components/ui/StatsCard';
import { Users, BookOpen, Clock, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const TeacherDashboard = () => {
    const stats = [
        { title: 'Total Students', value: '145', icon: Users, color: 'blue' },
        { title: 'Active Groups', value: '4', icon: BookOpen, color: 'purple' },
        { title: 'Hours Taught', value: '28h', change: 'this month', icon: Clock, color: 'green' },
    ];

    const schedule = [
        { time: '14:00 - 15:30', group: 'React N1', room: 'Room 204', topic: 'Redux Toolkit' },
        { time: '16:00 - 17:30', group: 'Foundation', room: 'Room 101', topic: 'HTML Basics' },
    ];

    const performanceData = [
        { name: 'React N1', score: 85 },
        { name: 'Foundation', score: 72 },
        { name: 'Python', score: 90 },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                <p className="text-gray-500">Welcome back, Ustoz Aliyev.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Today's Schedule */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Today's Schedule</h3>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {schedule.map((slot, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                                <div className="text-center min-w-[80px]">
                                    <div className="font-bold text-gray-800">{slot.time.split('-')[0]}</div>
                                    <div className="text-xs text-gray-500">{slot.time.split('-')[1]}</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-blue-600">{slot.group}</h4>
                                    <p className="text-sm text-gray-500">{slot.topic}</p>
                                </div>
                                <div className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                                    {slot.room}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Group Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Group Performance (Avg)</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="score" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
