import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Gradients - Smoother & More Subtle */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-25%] left-[-25%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -90, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-25%] right-[-25%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[120px]"
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Logo Box */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: 0.8
                    }}
                    className="relative mb-8"
                >
                    {/* Glow behind logo */}
                    <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-110"></div>

                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-white/10">
                        <GraduationCap size={40} className="text-white drop-shadow-md" strokeWidth={2.5} />

                        {/* Sparkle Icon Animation */}
                        <motion.div
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-lg border-2 border-slate-50"
                        >
                            <Sparkles size={12} className="text-yellow-900" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Text Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-center"
                >
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 flex items-center justify-center gap-2">
                        <span>TERRA</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">ACADEMY</span>
                    </h1>

                    {/* Custom Progress Bar */}
                    <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mx-auto relative">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 0.5
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-80"
                        />
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3"
                    >
                        Tizim Yuklanmoqda
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};

export default LoadingScreen;
