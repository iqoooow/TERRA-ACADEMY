import React from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical, Users } from 'lucide-react';

const GroupList = () => {
    // Mock Data
    const groups = [
        { id: 1, name: 'React N1', subject: 'Frontend React', teacher: 'Ustoz Aliyev', schedule: 'Mon/Wed/Fri 14:00', students: 15, status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 2, name: 'Python Back-2', subject: 'Backend Python', teacher: 'Sardor Rakhimov', schedule: 'Tue/Thu/Sat 10:00', students: 12, status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 3, name: 'English B2-4', subject: 'General English', teacher: 'Nodira Karimova', schedule: 'Mon/Wed/Fri 16:00', students: 10, status: 'Recruiting', bg: 'bg-yellow-100 text-yellow-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Groups</h1>
                    <p className="text-gray-500 text-sm">Manage study groups and schedules</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Group</span>
                    </button>
                </div>
            </div>

            <Table headers={['Group Name', 'Subject', 'Teacher', 'Schedule', 'Students', 'Status', 'Actions']}>
                {groups.map((group) => (
                    <TableRow key={group.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{group.name}</div>
                                    <div className="text-xs text-gray-400">ID: {group.id}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{group.subject}</TableCell>
                        <TableCell>{group.teacher}</TableCell>
                        <TableCell>{group.schedule}</TableCell>
                        <TableCell>{group.students}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${group.bg}`}>
                                {group.status}
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

export default GroupList;
