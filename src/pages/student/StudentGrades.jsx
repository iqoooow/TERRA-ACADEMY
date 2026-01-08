import React from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const StudentGrades = () => {
    // This could also include Schedule or be separate. For brevity, focusing on Grades/Schedule mix.
    const grades = [
        { id: 1, subject: 'React Frontend', title: 'Component LifeCycle', score: '95/100', date: '2026-01-01' },
        { id: 2, subject: 'Advanced Python', title: 'Django Views', score: '88/100', date: '2025-12-29' },
        { id: 3, subject: 'General English', title: 'Essay Writing', score: '100/100', date: '2025-12-25' },
    ];

    const weeklySchedule = [
        { day: 'Monday', time: '14:00', subject: 'React Frontend', room: '204' },
        { day: 'Wednesday', time: '14:00', subject: 'React Frontend', room: '204' },
        { day: 'Friday', time: '14:00', subject: 'React Frontend', room: '204' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Grades</h1>
                    <p className="text-gray-500 text-sm">Recent assessment results</p>
                </div>
                <Table headers={['Subject', 'Assessment', 'Score', 'Date']}>
                    {grades.map((grade) => (
                        <TableRow key={grade.id}>
                            <TableCell className="font-medium text-gray-800">{grade.subject}</TableCell>
                            <TableCell>{grade.title}</TableCell>
                            <TableCell>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                    {grade.score}
                                </span>
                            </TableCell>
                            <TableCell>{grade.date}</TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
                    <p className="text-gray-500 text-sm">Your upcoming classes</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    {weeklySchedule.map((slot, i) => (
                        <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="w-12 text-center pt-1">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{slot.day.substring(0, 3)}</div>
                                <div className="text-sm font-bold text-gray-800">{slot.time}</div>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-600">{slot.subject}</h4>
                                <p className="text-xs text-gray-400">Room {slot.room}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentGrades;
