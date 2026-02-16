import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, User, Bell, Search, ChevronDown, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
            'parents': "Ota-onalar",
            'groups': "Guruhlar",
            'subjects': "Fanlar",
            'finance': "Moliya",
            'schedule': "Dars jadvali",
            'attendance': "Davomat",
            'registration-requests': "Arizalar",
            'courses': "Kurslar",
            'grades': "Baholar",
            'exams': "Imtihonlar",
            'payments': "To'lovlar",
            'children': "Farzandlar",
        };

        return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    const mainContentMargin = isMobile ? 'ml-0' : (isSidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]');

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
            <Sidebar
                role={user?.role}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobile={isMobile}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? mainContentMargin : 'ml-0'}`}>
                {/* Header */}
                <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 transition-all">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 hover:bg-slate-100/80 rounded-xl transition-all text-slate-600 lg:hidden active:scale-95"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="flex flex-col">
                            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                                <span className="hover:text-blue-600 cursor-pointer transition-colors">Terra Academy</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-blue-600">{getPageTitle()}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex items-center gap-3 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all w-64 lg:w-96 group">
                            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Qidirish (cmd+k)"
                                className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-700 placeholder:text-slate-400"
                            />
                            <div className="text-xs font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">Ctrl K</div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <button className="p-2.5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 rounded-xl transition-all text-slate-500 relative group active:scale-95">
                                <Bell size={20} className="group-hover:text-blue-600 transition-colors" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm ring-2 ring-red-500/20"></span>
                            </button>

                            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                            <button className="flex items-center gap-3 p-1.5 pr-3 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 rounded-xl transition-all group border border-transparent hover:border-slate-100">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform text-sm font-bold">
                                    {user?.full_name?.charAt(0) || user?.name?.charAt(0) || <User size={18} />}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-blue-700 transition-colors">{user?.name || 'Admin'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-1 group-hover:text-blue-500/80 transition-colors">{user?.role || 'User'}</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors hidden lg:block" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    <div className="max-w-[1600px] mx-auto relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MainLayout;
