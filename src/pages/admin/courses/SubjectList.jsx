import React from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical, BookOpen } from 'lucide-react';

const SubjectList = () => {
    // Mock Data
    const subjects = [
        { id: 1, name: 'Frontend React', teacherCount: 3, studentCount: 45, status: 'Active', bg: 'bg-blue-100 text-blue-700' },
        { id: 2, name: 'Backend Python', teacherCount: 2, studentCount: 30, status: 'Active', bg: 'bg-blue-100 text-blue-700' },
        { id: 3, name: 'Foundation IT', teacherCount: 4, studentCount: 60, status: 'Active', bg: 'bg-blue-100 text-blue-700' },
        { id: 4, name: 'General English', teacherCount: 5, studentCount: 80, status: 'Active', bg: 'bg-blue-100 text-blue-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
                    <p className="text-gray-500 text-sm">Manage courses and subjects</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Subject</span>
                    </button>
                </div>
            </div>

            <Table headers={['Subject Name', 'Teachers', 'Students', 'Status', 'Actions']}>
                {subjects.map((sub) => (
                    <TableRow key={sub.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <BookOpen size={20} />
                                </div>
                                <div className="font-medium text-gray-900">{sub.name}</div>
                            </div>
                        </TableCell>
                        <TableCell>{sub.teacherCount} Teachers</TableCell>
                        <TableCell>{sub.studentCount} Students</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.bg}`}>
                                {sub.status}
                            </span>
                        </TableCell>
                        <TableCell>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
};

export default SubjectList;
