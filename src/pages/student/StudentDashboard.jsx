import React from 'react';
import StatsCard from '../../components/ui/StatsCard';
import { BookOpen, Trophy, Clock, Search } from 'lucide-react';
import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer
} from 'recharts';

const StudentDashboard = () => {
    const stats = [
        { title: 'GPA Score', value: '4.8', change: '+0.2', icon: Trophy, color: 'blue' },
        { title: 'Active Courses', value: '4', icon: BookOpen, color: 'purple' },
        { title: 'Attendance', value: '98%', change: '-1%', icon: Clock, color: 'green' },
    ];

    const upcomingExams = [
        { subject: 'React N1', title: 'Midterm Exam', date: 'Jan 10, 10:00', room: 'Room 204' },
        { subject: 'English B2', title: 'Vocabulary Test', date: 'Jan 12, 14:00', room: 'Room 101' },
    ];

    const progressData = [
        { name: 'React N1', uv: 90, fill: '#3B82F6' },
        { name: 'Python', uv: 75, fill: '#8B5CF6' },
        { name: 'English', uv: 85, fill: '#10B981' },
        { name: 'Math', uv: 60, fill: '#F59E0B' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                <p className="text-gray-500">Welcome back, Talababek.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Tasks */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Upcoming Exams</h3>
                    <div className="space-y-4">
                        {upcomingExams.map((exam, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl font-bold text-center leading-tight">
                                    <span className="block text-xs uppercase">{exam.date.split(' ')[0]}</span>
                                    <span className="block text-lg">{exam.date.split(' ')[1].replace(',', '')}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{exam.title}</h4>
                                    <p className="text-sm text-gray-500">{exam.subject} • {exam.room}</p>
                                </div>
                                <button className="bg-white text-gray-600 border border-gray-200 px-3 py-1 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600">
                                    Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Course Progress</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="10%" outerRadius="80%" barSize={20} data={progressData}>
                                <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background clockWise dataKey="uv" />
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)', lineHeight: '24px' }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
