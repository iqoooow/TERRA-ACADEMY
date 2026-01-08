import React from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import { Search, ChevronRight, GraduationCap } from 'lucide-react';

const TeacherGroups = () => {
    const groups = [
        { id: 1, name: 'React N1', level: 'Advanced', students: 15, schedule: 'Mon/Wed/Fri 14:00', progress: 75 },
        { id: 2, name: 'Foundation', level: 'Beginner', students: 20, schedule: 'Tue/Thu/Sat 10:00', progress: 40 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
                <p className="text-gray-500 text-sm">Select a group to manage grades and attendance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                    <div key={group.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all shadow-sm group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <GraduationCap size={24} />
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                                {group.level}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{group.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{group.students} Students • {group.schedule}</p>

                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${group.progress}%` }}></div>
                        </div>

                        <button className="w-full py-2 flex items-center justify-center gap-2 text-indigo-600 font-medium bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <span>Open Group</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherGroups;
