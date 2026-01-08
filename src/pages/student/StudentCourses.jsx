import React from 'react';
import { BookOpen, Clock, Activity, FileText } from 'lucide-react';

const StudentCourses = () => {
    const courses = [
        { id: 1, name: 'React Frontend', teacher: 'Ustoz Aliyev', progress: 85, grade: 'A', status: 'Ongoing', color: 'bg-blue-600' },
        { id: 2, name: 'Advanced Python', teacher: 'Sardor Rakhimov', progress: 60, grade: 'B+', status: 'Ongoing', color: 'bg-purple-600' },
        { id: 3, name: 'General English', teacher: 'Nodira Karimova', progress: 100, grade: 'A+', status: 'Completed', color: 'bg-green-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
                <p className="text-gray-500 text-sm">Track your learning progress and grades</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                        <div className={`h-24 ${course.color} p-6 flex items-end relative`}>
                            <h3 className="text-white font-bold text-xl relative z-10">{course.name}</h3>
                            <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg text-white">
                                <BookOpen size={20} />
                            </div>
                            {/* Decorative bubbles */}
                            <div className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-200 rounded-full"></div> {course.teacher}</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{course.status}</span>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="text-gray-800">{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className={`${course.color} h-2 rounded-full`} style={{ width: `${course.progress}%` }}></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-1">Current Grade</p>
                                    <p className="text-xl font-bold text-gray-800">{course.grade}</p>
                                </div>
                                <button className="px-4 py-2 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentCourses;
