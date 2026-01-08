import React from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';

const TeacherList = () => {
    const teachers = [
        { id: 1, name: 'Ustoz Aliyev', subject: 'Mathematics', phone: '+998 90 111 22 33', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 2, name: 'Nodira Karimova', subject: 'English', phone: '+998 90 333 44 55', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 3, name: 'Sardor Rakhimov', subject: 'Physics', phone: '+998 93 555 66 77', status: 'On Leave', bg: 'bg-yellow-100 text-yellow-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
                    <p className="text-gray-500 text-sm">Manage academy teachers</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Teacher</span>
                    </button>
                </div>
            </div>

            <Table headers={['Teacher Name', 'Subject', 'Phone Number', 'Status', 'Actions']}>
                {teachers.map((t) => (
                    <TableRow key={t.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="font-medium text-gray-900">{t.name}</div>
                            </div>
                        </TableCell>
                        <TableCell>{t.subject}</TableCell>
                        <TableCell>{t.phone}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.bg}`}>
                                {t.status}
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

export default TeacherList;
