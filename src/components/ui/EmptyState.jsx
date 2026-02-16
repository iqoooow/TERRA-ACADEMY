import React from 'react';
import { motion } from 'framer-motion';
import { FileSearch } from 'lucide-react';

const EmptyState = ({
    icon: Icon = FileSearch,
    title = "Ma'lumot topilmadi",
    description = "Siz izlayotgan ma'lumotlar hozircha mavjud emas yoki qidiruv natijasida hech narsa chiqmadi.",
    action
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center py-20 px-6 glass-card bg-white/40 border-dashed border-2 border-slate-200"
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 shadow-inner border border-slate-200 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={48} strokeWidth={1.5} />
                </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 text-center uppercase italic">
                {title}
            </h3>
            <p className="text-slate-500 font-medium max-w-sm text-center leading-relaxed text-sm">
                {description}
            </p>

            {action && (
                <div className="mt-8">
                    {action}
                </div>
            )}
        </motion.div>
    );
};

export default EmptyState;
