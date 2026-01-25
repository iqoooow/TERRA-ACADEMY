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
    Building2,
    ClipboardList,
    UserCheck,
    UsersRound,
    Calendar,
    MessageSquare,
    CalendarCheck,
    Menu
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = ({ role }) => {
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
        <div className="h-screen w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white flex flex-col shadow-2xl transition-all duration-300 fixed left-0 top-0 z-50">
            {/* Logo Section */}
            <div className="p-5 flex items-center gap-3 border-b border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold tracking-wide leading-tight">TERRA ACADEMY</h1>
                    <p className="text-[10px] text-cyan-300/80 uppercase tracking-wider">Ta'lim markazi</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm",
                                isActive
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 font-medium"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )
                        }
                    >
                        <link.icon size={18} />
                        <span>{link.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold shadow-lg">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-medium truncate text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-cyan-300/70 capitalize">{user?.role || 'Role'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    <span>Chiqish</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
