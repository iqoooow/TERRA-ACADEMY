import React, { useState } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';

const StudentList = () => {
    // Mock Data
    const students = [
        { id: 1, name: 'Azizbek Tursunov', group: 'React N1', phone: '+998 90 123 45 67', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 2, name: 'Malika Karimova', group: 'Python Backend', phone: '+998 90 987 65 43', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 3, name: 'Javohir Pulatov', group: 'Foundation', phone: '+998 91 111 22 33', status: 'Inactive', bg: 'bg-red-100 text-red-700' },
        { id: 4, name: 'Diyora Aliyeva', group: 'React N1', phone: '+998 93 444 55 66', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 5, name: 'Bekzod Rahimov', group: 'English B2', phone: '+998 99 888 77 00', status: 'Pending', bg: 'bg-yellow-100 text-yellow-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                    <p className="text-gray-500 text-sm">Manage your academy students</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Student</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search students by name, group, or phone..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                />
            </div>

            {/* Table */}
            <Table headers={['Student Name', 'Group', 'Phone Number', 'Status', 'Actions']}>
                {students.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                            </div>
                        </TableCell>
                        <TableCell>{student.group}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.bg}`}>
                                {student.status}
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

export default StudentList;
