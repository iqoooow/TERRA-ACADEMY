import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Filter, Download, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import StatsCard from '../../../components/ui/StatsCard';

const FinanceList = () => {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState([
        { title: 'Total Revenue', value: '$0', change: '0%', icon: DollarSign, color: 'green' },
        { title: 'Pending Payments', value: '$0', change: '0%', icon: AlertCircle, color: 'orange' },
        { title: 'Avg. Transaction', value: '$0', change: '0%', icon: TrendingUp, color: 'blue' },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinance = async () => {
            try {
                const { supabase } = await import('../../../lib/supabase');
                const { data, error } = await supabase
                    .from('payments')
                    .select(`
                        *,
                        profiles (full_name, first_name, last_name)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Process Data
                const formattedTrx = data?.map(t => ({
                    id: `TRX-${t.id}`,
                    student: t.profiles?.full_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}` || 'Unknown',
                    date: t.date,
                    amount: `$${Number(t.amount).toFixed(2)}`,
                    type: t.type || 'General',
                    status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
                    bg: t.status === 'paid' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                })) || [];

                setTransactions(formattedTrx);

                // Calculate Stats
                const totalRev = data?.filter(t => t.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                const pendingRev = data?.filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                const avgTrx = data?.length ? (totalRev / data.length) : 0;

                setStats([
                    { title: 'Total Revenue', value: `$${totalRev.toLocaleString()}`, change: '+0%', icon: DollarSign, color: 'green' },
                    { title: 'Pending Payments', value: `$${pendingRev.toLocaleString()}`, change: '0%', icon: AlertCircle, color: 'orange' },
                    { title: 'Avg. Transaction', value: `$${avgTrx.toFixed(0)}`, change: '0%', icon: TrendingUp, color: 'blue' },
                ]);

            } catch (err) {
                console.error('Error fetching finance:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFinance();
    }, []);

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
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading transactions...</div>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default FinanceList;
