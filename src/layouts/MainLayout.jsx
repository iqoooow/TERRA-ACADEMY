import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, User, Bell, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get page title from path
    const getPageTitle = () => {
        const path = location.pathname;
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'Dashboard';

        const titles = {
            'dashboard': 'Asosiy sahifa',
            'students': "O'quvchilar",
            'teachers': "O'qituvchilar",
            'parents': 'Ota-onalar',
            'groups': 'Guruhlar',
            'subjects': 'Fanlar',
            'finance': 'Moliya',
            'schedule': 'Dars jadvali',
            'attendance': 'Davomat',
            'registration-requests': 'Arizalar',
            'courses': 'Kurslar',
            'grades': 'Baholar',
            'exams': 'Imtihonlar',
            'payments': "To'lovlar",
            'children': 'Farzandlar',
        };

        return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            <Sidebar
                role={user?.role}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isMobile={isMobile}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
                            <span className="hover:text-slate-600 cursor-pointer transition-colors">Terra Academy</span>
                            <span>/</span>
                            <span className="text-slate-900 font-medium">{getPageTitle()}</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 sm:hidden">{getPageTitle()}</h2>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white transition-all">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Qidirish..."
                                className="bg-transparent border-none outline-none text-sm w-40 lg:w-60"
                            />
                        </div>

                        <div className="flex items-center gap-1 lg:gap-3">
                            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                            <button className="flex items-center gap-2 p-1 lg:pl-2 hover:bg-slate-100 rounded-xl transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                    <User size={16} />
                                </div>
                                <div className="text-left hidden lg:block pr-1">
                                    <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name || 'Admin'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{user?.role || 'User'}</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors hidden lg:block" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
