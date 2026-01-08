import React from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import { Search, Plus, FileText, ClipboardList } from 'lucide-react';

const TeacherExams = () => {
    // Mock Data
    const exams = [
        { id: 1, title: 'Midterm Exam - React', group: 'React N1', date: '2026-01-10', type: 'Written', status: 'Upcoming', bg: 'bg-blue-100 text-blue-700' },
        { id: 2, title: 'Final Test - Python', group: 'Python Back-2', date: '2025-12-28', type: 'Test', status: 'Graded', bg: 'bg-green-100 text-green-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Exams & Grading</h1>
                    <p className="text-gray-500 text-sm">Manage tests, exams, and enter grades</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Create Exam</span>
                    </button>
                </div>
            </div>

            <Table headers={['Exam Title', 'Group', 'Date', 'Type', 'Status', 'Actions']}>
                {exams.map((exam) => (
                    <TableRow key={exam.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div className="font-medium text-gray-900">{exam.title}</div>
                            </div>
                        </TableCell>
                        <TableCell>{exam.group}</TableCell>
                        <TableCell>{exam.date}</TableCell>
                        <TableCell>{exam.type}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${exam.bg}`}>
                                {exam.status}
                            </span>
                        </TableCell>
                        <TableCell>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Grades</button>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
};

export default TeacherExams;
