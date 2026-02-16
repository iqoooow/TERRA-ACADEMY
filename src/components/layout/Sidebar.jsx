import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    FileText,
    CreditCard,
    Bell,
    Settings,
    LogOut,
    UserCheck,
    UsersRound,
    Calendar,
    CalendarCheck,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    PieChart,
    Sparkles,
    Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ role, isOpen, setIsOpen, isCollapsed, setIsCollapsed, isMobile }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleCollapse = () => {
        if (!isMobile) {
            setIsCollapsed(!isCollapsed);
            setExpandedItem(null); // Close dropdowns on collapse
        }
    };

    const toggleDropdown = (name) => {
        if (isCollapsed) return; // Don't expand if collapsed
        setExpandedItem(expandedItem === name ? null : name);
    };

    // Role-based links definition
    const getLinks = (userRole) => {
        const adminLinks = [
            { name: 'Asosiy sahifa', path: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Arizalar', path: '/admin/registration-requests', icon: Bell },
            {
                name: 'Foydalanuvchilar',
                icon: UsersRound,
                type: 'dropdown',
                children: [
                    { name: "O'quvchilar", path: '/admin/students', icon: GraduationCap },
                    { name: "O'qituvchilar", path: '/admin/teachers', icon: UserCheck },
                    { name: "Ota-onalar", path: '/admin/parents', icon: UsersRound },
                ]
            },
            { name: 'Guruhlar', path: '/admin/groups', icon: Users },
            { name: 'Fanlar', path: '/admin/subjects', icon: BookOpen },
            { name: 'Moliya', path: '/admin/finance', icon: CreditCard },
            { name: 'Dars jadvali', path: '/admin/schedule', icon: Calendar },
            { name: 'Davomat', path: '/admin/attendance', icon: CalendarCheck },
            { name: 'Baholar', path: '/admin/grades', icon: PieChart },
            { name: "Oylik to'lovlar", path: '/admin/payments', icon: CreditCard },
        ];

        const teacherLinks = [
            { name: 'Kabinet', path: '/teacher/dashboard', icon: LayoutDashboard },
            { name: 'Guruhlarim', path: '/teacher/groups', icon: Users },
            { name: 'Imtihonlar', path: '/teacher/exams', icon: FileText },
            { name: 'Jurnal', path: '/teacher/grades', icon: GraduationCap },
            { name: 'Davomat', path: '/teacher/attendance', icon: CalendarCheck },
        ];

        const studentLinks = [
            { name: 'Kabinet', path: '/student/dashboard', icon: LayoutDashboard },
            { name: 'Kurslarim', path: '/student/courses', icon: BookOpen },
            { name: 'Baholarim', path: '/student/grades', icon: GraduationCap },
            { name: 'Dars jadvali', path: '/student/schedule', icon: Calendar },
        ];

        const parentLinks = [
            { name: 'Kabinet', path: '/parent/dashboard', icon: LayoutDashboard },
            { name: 'Farzandlar', path: '/parent/children', icon: Users },
            { name: "To'lov tarixi", path: '/parent/payments', icon: CreditCard },
        ];

        switch (userRole) {
            case 'owner': return adminLinks;
            case 'admin': return adminLinks;
            case 'teacher': return teacherLinks;
            case 'student': return studentLinks;
            case 'parent': return parentLinks;
            default: return [];
        }
    };

    const links = getLinks(role);
    const sidebarWidth = isMobile ? (isOpen ? 280 : 0) : (isCollapsed ? 88 : 280);

    return (
        <AnimatePresence mode="wait">
            {(isOpen || !isMobile) && (
                <motion.aside
                    initial={isMobile ? { x: -300, opacity: 0 } : { width: sidebarWidth }}
                    animate={isMobile ? { x: 0, opacity: 1 } : { width: sidebarWidth }}
                    exit={isMobile ? { x: -300, opacity: 0 } : { width: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-white/5 flex flex-col transition-all duration-300 shadow-2xl overflow-hidden backdrop-blur-xl",
                        isMobile ? "w-[280px]" : ""
                    )}
                >
                    {/* Background Texture over Dark BG */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50 contrast-200"></div>

                    {/* Glow Orb */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

                    {/* Brand Logo Section */}
                    <div className={cn("flex items-center gap-4 px-6 py-8 relative z-10 transition-all duration-300", isCollapsed ? "justify-center px-2" : "")}>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-600/20 shrink-0 cursor-pointer border border-white/10"
                        >
                            <GraduationCap size={24} className="text-white fill-white/10" />
                        </motion.div>

                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="whitespace-nowrap overflow-hidden"
                            >
                                <h1 className="text-lg font-black tracking-tighter text-white italic leading-none">TERRA</h1>
                                <h1 className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic leading-none">ACADEMY</h1>
                            </motion.div>
                        )}

                        {isMobile && (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-auto p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide relative z-10">
                        {links.map((link) => {
                            if (link.type === 'dropdown') {
                                const isExpanded = expandedItem === link.name;
                                const isChildActive = link.children.some(child => location.pathname === child.path);

                                return (
                                    <div key={link.name} className="space-y-1">
                                        <button
                                            onClick={() => toggleDropdown(link.name)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                                isChildActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                                                isCollapsed ? "justify-center px-0" : ""
                                            )}
                                        >
                                            {isChildActive && !isExpanded && (
                                                <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-r-full" />
                                            )}

                                            <link.icon
                                                size={20}
                                                className={cn(
                                                    "transition-all duration-300 shrink-0",
                                                    isChildActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                                )}
                                            />

                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left font-bold text-sm tracking-wide">
                                                        {link.name}
                                                    </span>
                                                    <ChevronDown
                                                        size={14}
                                                        className={cn("transition-transform duration-300", isExpanded && "rotate-180")}
                                                    />
                                                </>
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && !isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden pl-4 space-y-1"
                                                >
                                                    {link.children.map((child) => (
                                                        <NavLink
                                                            key={child.path}
                                                            to={child.path}
                                                            onClick={() => isMobile && setIsOpen(false)}
                                                            className={({ isActive }) => cn(
                                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                                                                isActive
                                                                    ? "text-blue-400 bg-blue-500/10 font-black"
                                                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5 font-bold"
                                                            )}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                                                            <span className="text-xs tracking-wide">
                                                                {child.name}
                                                            </span>
                                                        </NavLink>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => isMobile && setIsOpen(false)}
                                    title={isCollapsed ? link.name : ''}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                                        isCollapsed ? "justify-center px-0" : ""
                                    )}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-bg"
                                                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-md shadow-blue-900/20"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}

                                            <div className="relative z-10 flex items-center justify-center">
                                                <link.icon
                                                    size={20}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={cn(
                                                        "transition-all duration-300",
                                                        isActive ? "text-white scale-110" : "text-slate-500 group-hover:text-slate-300",
                                                        isCollapsed && "mx-auto"
                                                    )}
                                                />
                                            </div>

                                            {!isCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={cn(
                                                        "font-bold text-sm tracking-wide relative z-10 whitespace-nowrap",
                                                        isActive ? "text-white" : ""
                                                    )}
                                                >
                                                    {link.name}
                                                </motion.span>
                                            )}

                                            {!isCollapsed && isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute right-3"
                                                >
                                                    <Sparkles size={12} className="text-blue-300 opacity-50" />
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* User Section */}
                    <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md z-10 mx-2 mb-2 rounded-2xl">
                        <div className={cn("flex items-center gap-3 mb-1 transition-all", isCollapsed ? "justify-center" : "")}>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-black shadow-inner text-white shrink-0 border border-white/10">
                                    {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            </div>

                            {!isCollapsed && (
                                <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-bold truncate text-white">{user?.full_name || user?.name || 'Foydalanuvchi'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Shield size={10} className="text-blue-400" />
                                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none">{role || 'Role'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="mt-3 w-full py-2.5 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all text-xs font-black uppercase tracking-widest group"
                            >
                                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                                <span>Chiqish</span>
                            </button>
                        )}

                        {isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="mt-2 w-full py-2 flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
                                title="Chiqish"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>

                    {/* Desktop Collapse Toggle */}
                    {!isMobile && (
                        <button
                            onClick={toggleCollapse}
                            className="absolute -right-3 top-24 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full shadow-xl hover:scale-110 transition-all z-50 border border-white/10 hover:bg-slate-700"
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    )}
                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
