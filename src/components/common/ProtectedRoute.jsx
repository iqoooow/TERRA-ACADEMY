import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>; // Or a nice spinner
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if they try to access a route they aren't authorized for
        // Or a 403 page. For now, let's send them to their role's dashboard.
        switch (user.role) {
            case 'owner': return <Navigate to="/admin/dashboard" replace />;
            case 'teacher': return <Navigate to="/teacher/dashboard" replace />;
            case 'student': return <Navigate to="/student/dashboard" replace />;
            case 'parent': return <Navigate to="/parent/dashboard" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
