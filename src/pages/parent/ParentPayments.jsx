import React from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const ParentPayments = () => {
    const payments = [
        { id: 'INV-001', month: 'January 2026', amount: '$120.00', status: 'Paid', date: '2026-01-02' },
        { id: 'INV-002', month: 'December 2025', amount: '$120.00', status: 'Paid', date: '2025-12-05' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
                <p className="text-gray-500 text-sm">Transaction history and invoices</p>
            </div>

            <Table headers={['Invoice ID', 'Month', 'Amount', 'Date', 'Status']}>
                {payments.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-mono text-gray-500">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.month}</TableCell>
                        <TableCell>{p.amount}</TableCell>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                {p.status}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
};

export default ParentPayments;
