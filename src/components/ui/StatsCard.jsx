import React, { memo } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, icon: Icon, color = "blue", idx = 0, trendLabel = "o'tgan oy", loading = false }) => {
    // Detect trend direction
    const isPositive = typeof change === 'string' && change.startsWith('+');
    const isNegative = typeof change === 'string' && change.startsWith('-');
    const isNeutral = !isPositive && !isNegative;

    const colorVariants = {
        blue: {
            bg: 'bg-blue-50 group-hover:bg-blue-100',
            text: 'text-blue-600',
            border: 'border-blue-100',
            iconBg: 'bg-blue-100 text-blue-600',
            blob: 'bg-blue-500'
        },
        purple: {
            bg: 'bg-purple-50 group-hover:bg-purple-100',
            text: 'text-purple-600',
            border: 'border-purple-100',
            iconBg: 'bg-purple-100 text-purple-600',
            blob: 'bg-purple-500'
        },
        green: {
            bg: 'bg-emerald-50 group-hover:bg-emerald-100',
            text: 'text-emerald-600',
            border: 'border-emerald-100',
            iconBg: 'bg-emerald-100 text-emerald-600',
            blob: 'bg-emerald-500'
        },
        orange: {
            bg: 'bg-orange-50 group-hover:bg-orange-100',
            text: 'text-orange-600',
            border: 'border-orange-100',
            iconBg: 'bg-orange-100 text-orange-600',
            blob: 'bg-orange-500'
        },
        indigo: {
            bg: 'bg-indigo-50 group-hover:bg-indigo-100',
            text: 'text-indigo-600',
            border: 'border-indigo-100',
            iconBg: 'bg-indigo-100 text-indigo-600',
            blob: 'bg-indigo-500'
        },
        rose: {
            bg: 'bg-rose-50 group-hover:bg-rose-100',
            text: 'text-rose-600',
            border: 'border-rose-100',
            iconBg: 'bg-rose-100 text-rose-600',
            blob: 'bg-rose-500'
        },
        amber: {
            bg: 'bg-amber-50 group-hover:bg-amber-100',
            text: 'text-amber-600',
            border: 'border-amber-100',
            iconBg: 'bg-amber-100 text-amber-600',
            blob: 'bg-amber-500'
        },
        cyan: {
            bg: 'bg-cyan-50 group-hover:bg-cyan-100',
            text: 'text-cyan-600',
            border: 'border-cyan-100',
            iconBg: 'bg-cyan-100 text-cyan-600',
            blob: 'bg-cyan-500'
        },
        violet: {
            bg: 'bg-violet-50 group-hover:bg-violet-100',
            text: 'text-violet-600',
            border: 'border-violet-100',
            iconBg: 'bg-violet-100 text-violet-600',
            blob: 'bg-violet-500'
        },
        emerald: {
            bg: 'bg-emerald-50 group-hover:bg-emerald-100',
            text: 'text-emerald-600',
            border: 'border-emerald-100',
            iconBg: 'bg-emerald-100 text-emerald-600',
            blob: 'bg-emerald-500'
        },
        teal: {
            bg: 'bg-teal-50 group-hover:bg-teal-100',
            text: 'text-teal-600',
            border: 'border-teal-100',
            iconBg: 'bg-teal-100 text-teal-600',
            blob: 'bg-teal-500'
        }
    };

    const currentVariant = colorVariants[color] || colorVariants.blue;

    if (loading) {
        return (
            <div className="glass-card p-4 sm:p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-full">
                        <div className="skeleton h-2.5 w-1/2 mb-2"></div>
                        <div className="skeleton h-7 w-3/4"></div>
                    </div>
                    <div className="skeleton h-10 w-10 shrink-0 rounded-xl"></div>
                </div>
                <div className="flex gap-2">
                    <div className="skeleton h-5 w-14"></div>
                    <div className="skeleton h-5 w-20"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group glass-card p-4 sm:p-6 relative overflow-hidden h-full flex flex-col justify-between"
        >
            <div className={cn(
                "absolute -right-8 -top-8 w-28 h-28 rounded-full blur-[60px] opacity-20 transition-all duration-500 group-hover:opacity-30",
                currentVariant.blob
            )}></div>

            <div className="flex justify-between items-start mb-3 sm:mb-6 relative z-10">
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 truncate">{title}</p>
                    <motion.h3
                        key={value}
                        initial={{ scale: 0.95, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate pr-1"
                        title={typeof value === 'string' ? value : ''}
                    >
                        {value}
                    </motion.h3>
                </div>

                <div className={cn(
                    "p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm shrink-0 group-hover:scale-110",
                    currentVariant.iconBg
                )}>
                    {Icon && <Icon size={20} strokeWidth={2.5} />}
                </div>
            </div>

            {change && (
                <div className="flex items-center gap-1.5 relative z-10 mt-auto flex-wrap">
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold",
                        isPositive ? "bg-emerald-500/10 text-emerald-600" :
                            isNegative ? "bg-rose-500/10 text-rose-600" :
                                "bg-slate-100 text-slate-500"
                    )}>
                        {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
                        {change}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {trendLabel}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default memo(StatsCard);
