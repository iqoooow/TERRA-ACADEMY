import React from 'react';
import { cn } from '../../utils/cn';

const Table = ({ headers, children, className }) => {
    return (
        <div className={cn("w-full", className)}>
            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left text-sm text-slate-600 border-separate border-spacing-y-3">
                    <thead>
                        <tr className="bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">
                            {headers.map((header, index) => (
                                <th key={index} className="px-6 pb-2 whitespace-nowrap first:pl-10 last:pr-10">
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
        "hover:-translate-y-0.5",
        className
    )}>
        {children}
    </tr>
);

export const TableCell = ({ children, className, colSpan }) => (
    <td className={cn(
        "px-6 py-5 whitespace-nowrap first:pl-10 last:pr-10 font-medium",
        "first:rounded-l-[2.5rem] last:rounded-r-[2.5rem]",
        "border-y border-white/50 first:border-l last:border-r",
        "group-hover:border-blue-500/10 transition-colors",
        className
    )} colSpan={colSpan}>
        {children}
    </td>
);

export default Table;
