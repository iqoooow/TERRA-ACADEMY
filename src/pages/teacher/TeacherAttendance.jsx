import React, { useState } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';

const TeacherAttendance = () => {
    const [selectedGroup, setSelectedGroup] = useState('React N1');
    const [date, setDate] = useState('2026-01-02');

    const students = [
        { id: 1, name: 'Azizbek Tursunov', status: 'Present' },
        { id: 2, name: 'Diyora Aliyeva', status: 'Absent' },
        { id: 3, name: 'Vali Karimov', status: 'Late' },
        { id: 4, name: 'Guli Rahimova', status: 'Present' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
                    <p className="text-gray-500 text-sm">Mark student attendance for today</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option>React N1</option>
                        <option>Python Back-2</option>
                    </select>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">{selectedGroup} - {date}</h3>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                        Save Attendance
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {students.map((student) => (
                        <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {student.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-700">{student.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors focus:ring-2 focus:ring-green-500 ring-inset">
                                    <Check size={20} className={student.status === 'Present' ? 'text-green-600' : ''} />
                                    <span className="text-[10px] uppercase font-bold">Present</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors focus:ring-2 focus:ring-red-500 ring-inset">
                                    <X size={20} className={student.status === 'Absent' ? 'text-red-600' : ''} />
                                    <span className="text-[10px] uppercase font-bold">Absent</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors focus:ring-2 focus:ring-yellow-500 ring-inset">
                                    <Clock size={20} className={student.status === 'Late' ? 'text-yellow-600' : ''} />
                                    <span className="text-[10px] uppercase font-bold">Late</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendance;
