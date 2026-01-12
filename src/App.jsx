import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentList from './pages/admin/students/StudentList';
import TeacherList from './pages/admin/teachers/TeacherList';
import ParentList from './pages/admin/parents/ParentList';
import RegistrationRequests from './pages/admin/RegistrationRequests';
import SubjectList from './pages/admin/courses/SubjectList';
import GroupList from './pages/admin/courses/GroupList';
import FinanceList from './pages/admin/finance/FinanceList';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherGroups from './pages/teacher/TeacherGroups';
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentGrades from './pages/student/StudentGrades';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildPerformance from './pages/parent/ChildPerformance';
import ParentPayments from './pages/parent/ParentPayments';

import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Owner / Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/registration-requests" element={<RegistrationRequests />} />
              <Route path="/admin/students" element={<StudentList />} />
              <Route path="/admin/teachers" element={<TeacherList />} />
              <Route path="/admin/parents" element={<ParentList />} />
              <Route path="/admin/subjects" element={<SubjectList />} />
              <Route path="/admin/groups" element={<GroupList />} />
              <Route path="/admin/finance" element={<FinanceList />} />
            </Route>
          </Route>

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route element={<MainLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/groups" element={<TeacherGroups />} />
              <Route path="/teacher/exams" element={<TeacherExams />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            </Route>
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<MainLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCourses />} />
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/schedule" element={<StudentGrades />} /> {/* Reusing component for now */}
            </Route>
          </Route>

          {/* Parent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
            <Route element={<MainLayout />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/children" element={<ChildPerformance />} />
              <Route path="/parent/payments" element={<ParentPayments />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
