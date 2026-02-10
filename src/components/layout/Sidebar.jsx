import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ role, isOpen, setIsOpen, isMobile }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminLinks = [
        { name: 'Asosiy sahifa', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Arizalar', path: '/admin/registration-requests', icon: Bell },
        { name: "O'quvchilar", path: '/admin/students', icon: GraduationCap },
        { name: "O'qituvchilar", path: '/admin/teachers', icon: UserCheck },
        { name: 'Ota-onalar', path: '/admin/parents', icon: UsersRound },
        { name: 'Guruhlar', path: '/admin/groups', icon: Users },
        { name: 'Fanlar', path: '/admin/subjects', icon: BookOpen },
        { name: 'Moliya', path: '/admin/finance', icon: CreditCard },
        { name: 'Dars jadvali', path: '/admin/schedule', icon: Calendar },
        { name: 'Davomat', path: '/admin/attendance', icon: CalendarCheck },
        { name: 'Baholar', path: '/admin/grades', icon: GraduationCap },
        { name: "Oylik to'lovlar", path: '/admin/payments', icon: CreditCard },
    ];

    const teacherLinks = [
        { name: 'Asosiy sahifa', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Guruhlarim', path: '/teacher/groups', icon: Users },
        { name: 'Imtihonlar', path: '/teacher/exams', icon: FileText },
        { name: 'Baholar', path: '/teacher/grades', icon: GraduationCap },
        { name: 'Davomat', path: '/teacher/attendance', icon: CalendarCheck },
    ];

    const studentLinks = [
        { name: 'Asosiy sahifa', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Kurslarim', path: '/student/courses', icon: BookOpen },
        { name: 'Baholar', path: '/student/grades', icon: GraduationCap },
        { name: 'Dars jadvali', path: '/student/schedule', icon: Calendar },
    ];

    const parentLinks = [
        { name: 'Asosiy sahifa', path: '/parent/dashboard', icon: LayoutDashboard },
        { name: 'Farzandlar', path: '/parent/children', icon: Users },
        { name: "To'lovlar", path: '/parent/payments', icon: CreditCard },
    ];

    let links = [];
    if (role === 'owner') links = adminLinks;
    else if (role === 'teacher') links = teacherLinks;
    else if (role === 'student') links = studentLinks;
    else if (role === 'parent') links = parentLinks;

    return (
        <AnimatePresence>
            {(isOpen || !isMobile) && (
                <motion.aside
                    initial={isMobile ? { x: -280 } : { x: 0 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 shadow-2xl flex flex-col",
                        !isOpen && !isMobile && "pointer-events-none opacity-0 lg:opacity-100 lg:relative lg:translate-x-0"
                    )}
                >
                    {/* Brand Logo Section */}
                    <div className="flex items-center gap-3 px-6 py-8">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter text-white italic leading-tight">TERRA ACADEMY</h1>
                            <div className="h-1 w-12 bg-blue-500 rounded-full mt-1"></div>
                        </div>
                        {isMobile && (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-auto p-2 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
                        {links.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => isMobile && setIsOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <link.icon size={18} className={cn("transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                                        <span className="font-semibold text-sm tracking-wide">{link.name}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Section */}
                    <div className="p-4 border-t border-white/5 bg-white/5 mt-auto">
                        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black shadow-inner text-white">
                                {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-bold truncate text-white uppercase tracking-tight">{user?.full_name || user?.name || 'Foydalanuvchi'}</p>
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none mt-0.5">{role || 'Role'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-xs font-black uppercase tracking-widest group"
                        >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Chiqish</span>
                        </button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
