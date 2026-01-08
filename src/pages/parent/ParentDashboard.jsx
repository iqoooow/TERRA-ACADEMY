import React from 'react';
import StatsCard from '../../components/ui/StatsCard';
import { User, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ParentDashboard = () => {
    // Mock Data for Children
    const children = [
        { id: 1, name: 'Azizbek Tursunov', group: 'React N1', gpa: '4.8', attendance: '98%', fees: 'Paid' },
        { id: 2, name: 'Malika Tursunova', group: 'General English', gpa: '4.5', attendance: '92%', fees: 'Due' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
                <p className="text-gray-500">Overview of your children's progress</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => (
                    <div key={child.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <User size={100} />
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{child.name}</h2>
                                <p className="text-gray-500">{child.group}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">GPA Score</p>
                                <p className="text-lg font-bold text-blue-600">{child.gpa}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Attendance</p>
                                <p className={`text-lg font-bold ${parseInt(child.attendance) > 90 ? 'text-green-600' : 'text-orange-600'}`}>{child.attendance}</p>
                            </div>
                        </div>

                        {child.fees === 'Due' && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm font-medium">
                                <AlertTriangle size={16} />
                                <span>Monthly payment is due!</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Link to="/parent/children" className="flex-1 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                View Details
                            </Link>
                            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                                Message Teacher
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParentDashboard;
