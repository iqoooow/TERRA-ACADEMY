import React from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';

const ParentList = () => {
    const parents = [
        { id: 1, name: 'Ota-ona Valiyev', children: '2 Students', phone: '+998 90 000 00 00', status: 'Active', bg: 'bg-green-100 text-green-700' },
        { id: 2, name: 'Dilnoza Saidova', children: '1 Student', phone: '+998 90 999 88 77', status: 'Active', bg: 'bg-green-100 text-green-700' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Parents</h1>
                    <p className="text-gray-500 text-sm">Manage parents and accounts</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Parent</span>
                    </button>
                </div>
            </div>

            <Table headers={['Parent Name', 'Children Count', 'Phone Number', 'Status', 'Actions']}>
                {parents.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="font-medium text-gray-900">{p.name}</div>
                            </div>
                        </TableCell>
                        <TableCell>{p.children}</TableCell>
                        <TableCell>{p.phone}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.bg}`}>
                                {p.status}
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

export default ParentList;
