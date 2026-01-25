import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

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
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar role={user?.role} />
            <div className="flex-1 ml-64 transition-all duration-300">
                {/* Header */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Menu size={20} className="text-gray-600" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Online
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-800">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
