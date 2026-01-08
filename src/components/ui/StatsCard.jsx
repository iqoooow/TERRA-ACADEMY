import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const StatsCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
    const isPositive = change?.startsWith('+');

    const colorVariants = {
        blue: 'bg-blue-500/10 text-blue-600',
        purple: 'bg-purple-500/10 text-purple-600',
        green: 'bg-green-500/10 text-green-600',
        orange: 'bg-orange-500/10 text-orange-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", colorVariants[color])}>
                    <Icon size={24} />
                </div>
            </div>

            {change && (
                <div className="flex items-center gap-1 text-sm">
                    <span className={cn(
                        "flex items-center font-medium",
                        isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        {change}
                    </span>
                    <span className="text-gray-400">from last month</span>
                </div>
            )}
        </div>
    );
};

export default StatsCard;
