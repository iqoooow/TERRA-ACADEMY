import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, icon: Icon, color = "blue", idx = 0 }) => {
    const isPositive = change?.startsWith('+');

    const colorVariants = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 border-blue-200/50',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-600 border-purple-200/50',
        green: 'from-emerald-500/20 to-emerald-600/5 text-emerald-600 border-emerald-200/50',
        orange: 'from-orange-500/20 to-orange-600/5 text-orange-600 border-orange-200/50',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group glass-card p-6 relative overflow-hidden"
        >
            {/* Background Decorative Gradient */}
            <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
                color === 'blue' && 'bg-blue-500',
                color === 'purple' && 'bg-purple-500',
                color === 'green' && 'bg-emerald-500',
                color === 'orange' && 'bg-orange-500',
            )}></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                    <motion.h3
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-black text-slate-900 tracking-tight"
                    >
                        {value}
                    </motion.h3>
                </div>
                <div className={cn(
                    "p-3 rounded-2xl bg-gradient-to-br border shadow-sm transition-transform group-hover:scale-110",
                    colorVariants[color]
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>

            {change && (
                <div className="flex items-center gap-2 relative z-10">
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                        isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    )}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {change}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">O'tgan oyga nisbatan</span>
                </div>
            )}
        </motion.div>
    );
};

export default StatsCard;

