import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar role={user?.role} />
            <div className="flex-1 ml-64 transition-all duration-300">
                {/* Header could go here */}
                {/* <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-gray-800">Overview</h2>
                </header> */}
                <main className="p-8 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
