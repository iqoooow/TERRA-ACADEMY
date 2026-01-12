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
    ChevronRight
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
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Arizalar', path: '/admin/registration-requests', icon: Bell },
        { name: 'Students', path: '/admin/students', icon: GraduationCap },
        { name: 'Teachers', path: '/admin/teachers', icon: Users },
        { name: 'Parents', path: '/admin/parents', icon: Users }, // Using generic users icon for now
        { name: 'Groups', path: '/admin/groups', icon: Users },
        { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
        { name: 'Finance', path: '/admin/finance', icon: CreditCard },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const teacherLinks = [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'My Groups', path: '/teacher/groups', icon: Users },
        { name: 'Exams', path: '/teacher/exams', icon: FileText },
        { name: 'Attendance', path: '/teacher/attendance', icon: FileText },
        { name: 'Profile', path: '/teacher/profile', icon: Settings },
    ];

    const studentLinks = [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'My Courses', path: '/student/courses', icon: BookOpen },
        { name: 'Grades', path: '/student/grades', icon: GraduationCap },
        { name: 'Schedule', path: '/student/schedule', icon: FileText },
    ];

    const parentLinks = [
        { name: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
        { name: 'Children', path: '/parent/children', icon: Users },
        { name: 'Payments', path: '/parent/payments', icon: CreditCard },
    ];

    let links = [];
    if (role === 'owner') links = adminLinks;
    else if (role === 'teacher') links = teacherLinks;
    else if (role === 'student') links = studentLinks;
    else if (role === 'parent') links = parentLinks;

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3 border-b border-gray-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <GraduationCap size={24} />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-wider">TERRA</h1>
                    <p className="text-xs text-gray-400">Academy Admin</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )
                        }
                    >
                        <link.icon size={20} className="relative z-10" />
                        <span className="font-medium relative z-10">{link.name}</span>
                        {/* Hover effect decoration */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
