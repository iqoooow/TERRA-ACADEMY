import React from 'react';
import { cn } from '../../utils/cn';

const Table = ({ headers, children, className }) => {
    return (
        <div className={cn("overflow-hidden rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/40 bg-white/50 backdrop-blur-md", className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 uppercase text-[11px] font-black tracking-widest text-slate-400 border-b border-slate-200/60">
                        <tr>
                            {headers.map((header, index) => (
                                <th key={index} className="px-6 py-5 whitespace-nowrap first:pl-8 last:pr-8">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TableRow = ({ children, className }) => (
    <tr className={cn("hover:bg-blue-50/50 transition-colors group", className)}>
        {children}
    </tr>
);

export const TableCell = ({ children, className, colSpan }) => (
    <td className={cn("px-6 py-4 whitespace-nowrap first:pl-8 last:pr-8 font-medium", className)} colSpan={colSpan}>
        {children}
    </td>
);

export default Table;
