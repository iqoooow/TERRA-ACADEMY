import React from 'react';
import { cn } from '../../utils/cn';

const Table = ({ headers, children }) => {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-700">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className="px-6 py-4 whitespace-nowrap">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const TableRow = ({ children, className }) => (
    <tr className={cn("hover:bg-gray-50 transition-colors", className)}>
        {children}
    </tr>
);

export const TableCell = ({ children, className, colSpan }) => (
    <td className={cn("px-6 py-4 whitespace-nowrap", className)} colSpan={colSpan}>
        {children}
    </td>
);

export default Table;
