import React from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Filter, Download, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import StatsCard from '../../../components/ui/StatsCard';

const FinanceList = () => {
    // Mock Data
    const transactions = [
        { id: 'TRX-9871', student: 'Azizbek Tursunov', date: '2026-01-02', amount: '$120.00', type: 'Tuition Fee', status: 'Completed', bg: 'bg-green-100 text-green-700' },
        { id: 'TRX-9872', student: 'Malika Karimova', date: '2026-01-01', amount: '$100.00', type: 'Materials', status: 'Pending', bg: 'bg-yellow-100 text-yellow-700' },
        { id: 'TRX-9873', student: 'Javohir Pulatov', date: '2025-12-28', amount: '$120.00', type: 'Tuition Fee', status: 'Failed', bg: 'bg-red-100 text-red-700' },
    ];

    const financeStats = [
        { title: 'Total Revenue', value: '$12,450', change: '+15%', icon: DollarSign, color: 'green' },
        { title: 'Pending Payments', value: '$1,200', change: '-5%', icon: AlertCircle, color: 'orange' },
        { title: 'Avg. Transaction', value: '$115', change: '+2%', icon: TrendingUp, color: 'blue' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Finance & Payments</h1>
                    <p className="text-gray-500 text-sm">Monitor financial health and transactions</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Download size={18} />
                        <span>Export Report</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <DollarSign size={18} />
                        <span>Record Payment</span>
                    </button>
                </div>
            </div>

            {/* Finance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {financeStats.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <Table headers={['ID', 'Student', 'Date', 'Type', 'Amount', 'Status', 'Actions']}>
                    {transactions.map((trx) => (
                        <TableRow key={trx.id}>
                            <TableCell><span className="font-mono text-xs text-gray-500">{trx.id}</span></TableCell>
                            <TableCell>
                                <div className="font-medium text-gray-900">{trx.student}</div>
                            </TableCell>
                            <TableCell>{trx.date}</TableCell>
                            <TableCell>{trx.type}</TableCell>
                            <TableCell className="font-bold text-gray-800">{trx.amount}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trx.bg}`}>
                                    {trx.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>
        </div>
    );
};

export default FinanceList;
