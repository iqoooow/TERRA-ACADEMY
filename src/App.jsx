import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts & Components
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentList = lazy(() => import('./pages/admin/students/StudentList'));
const TeacherList = lazy(() => import('./pages/admin/teachers/TeacherList'));
const ParentList = lazy(() => import('./pages/admin/parents/ParentList'));
const RegistrationRequests = lazy(() => import('./pages/admin/RegistrationRequests'));
const SubjectList = lazy(() => import('./pages/admin/courses/SubjectList'));
const GroupList = lazy(() => import('./pages/admin/courses/GroupList'));
const FinanceList = lazy(() => import('./pages/admin/finance/FinanceList'));
const ScheduleList = lazy(() => import('./pages/admin/schedule/ScheduleList'));
const AttendanceList = lazy(() => import('./pages/admin/attendance/AttendanceList'));
const GradeList = lazy(() => import('./pages/admin/grades/GradeList'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherGroups = lazy(() => import('./pages/teacher/TeacherGroups'));
const TeacherExams = lazy(() => import('./pages/teacher/TeacherExams'));
const TeacherGrades = lazy(() => import('./pages/teacher/TeacherGrades'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'));

// Parent Pages
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ChildPerformance = lazy(() => import('./pages/parent/ChildPerformance'));
const ParentPayments = lazy(() => import('./pages/parent/ParentPayments'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Yuklamoqda...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
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
                <Route path="/admin/schedule" element={<ScheduleList />} />
                <Route path="/admin/attendance" element={<AttendanceList />} />
                <Route path="/admin/grades" element={<GradeList />} />
              </Route>
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route element={<MainLayout />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/groups" element={<TeacherGroups />} />
                <Route path="/teacher/exams" element={<TeacherExams />} />
                <Route path="/teacher/grades" element={<TeacherGrades />} />
                <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              </Route>
            </Route>

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route element={<MainLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/courses" element={<StudentCourses />} />
                <Route path="/student/grades" element={<StudentGrades />} />
                <Route path="/student/schedule" element={<StudentGrades />} />
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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

