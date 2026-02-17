import React from 'react';
import { cn } from '../../utils/cn';

const Table = ({ headers, children, className }) => {
    return (
        <div className={cn("w-full", className)}>
            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left text-sm text-slate-600 border-separate border-spacing-y-4">
                    <thead>
                        <tr className="bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">
                            {headers.map((header, index) => (
                                <th key={index} className="px-8 pb-4 whitespace-nowrap first:pl-12 last:pr-12">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="relative z-10">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TableRow = ({ children, className }) => (
    <tr className={cn(
        "bg-white/80 backdrop-blur-md hover:bg-white transition-all duration-500 group relative",
        "shadow-sm hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]",
        "hover:-translate-y-1",
        className
    )}>
        {children}
    </tr>
);

export const TableCell = ({ children, className, colSpan }) => (
    <td className={cn(
        "px-8 py-6 whitespace-nowrap first:pl-12 last:pr-12 font-medium",
        "first:rounded-l-[3rem] last:rounded-r-[3rem]",
        "border-y border-white/50 first:border-l last:border-r",
        "group-hover:border-blue-500/10 transition-colors",
        className
    )} colSpan={colSpan}>
        {children}
    </td>
);

export default Table;
