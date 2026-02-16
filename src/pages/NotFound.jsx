import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center relative z-10 max-w-lg"
            >
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[120px] md:text-[180px] font-black text-slate-200 leading-none select-none tracking-tighter"
                >
                    404
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight -mt-6 mb-4">
                    Sahifa topilmadi
                </h1>
                <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
                    Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="btn-primary px-8 py-4 rounded-2xl"
                    >
                        <Home size={18} />
                        Bosh sahifaga qaytish
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary px-8 py-4 rounded-2xl"
                    >
                        <ArrowLeft size={18} />
                        Orqaga qaytish
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
