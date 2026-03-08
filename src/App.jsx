import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from './components/common/LoadingScreen';

// Layouts & Components
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import NotFound from './pages/NotFound';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));

// Onboarding
const FirstLoginSetup = lazy(() => import('./pages/onboarding/FirstLoginSetup'));

// Settings (all roles)
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentList = lazy(() => import('./pages/admin/students/StudentList'));
const StudentProfile = lazy(() => import('./pages/admin/students/StudentProfile'));
const TeacherList = lazy(() => import('./pages/admin/teachers/TeacherList'));
const TeacherProfile = lazy(() => import('./pages/admin/teachers/TeacherProfile'));
const ParentList = lazy(() => import('./pages/admin/parents/ParentList'));
const ParentProfile = lazy(() => import('./pages/admin/parents/ParentProfile'));
const RegistrationRequests = lazy(() => import('./pages/admin/RegistrationRequests'));
const SubjectList = lazy(() => import('./pages/admin/courses/SubjectList'));
const GroupList = lazy(() => import('./pages/admin/courses/GroupList'));
const FinancialCenter = lazy(() => import('./pages/admin/finance/FinancialCenter'));
const ScheduleList = lazy(() => import('./pages/admin/schedule/ScheduleList'));
const AttendanceList = lazy(() => import('./pages/admin/attendance/AttendanceList'));
const GradeList = lazy(() => import('./pages/admin/grades/GradeList'));
// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherGroups = lazy(() => import('./pages/teacher/TeacherGroups'));
const TeacherGroupDetail = lazy(() => import('./pages/teacher/TeacherGroupDetail'));
const TeacherExams = lazy(() => import('./pages/teacher/TeacherExams'));
const TeacherGrades = lazy(() => import('./pages/teacher/TeacherGrades'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));

// Student Pages
const StudentPayments = lazy(() => import('./pages/student/StudentPayments'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'));
const StudentSchedule = lazy(() => import('./pages/student/StudentSchedule'));

// Parent Pages
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ChildPerformance = lazy(() => import('./pages/parent/ChildPerformance'));
const ParentPayments = lazy(() => import('./pages/parent/ParentPayments'));

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-card text-sm font-bold',
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#0f172a',
          }
        }}
      />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* First Login Setup — authenticated, any role, no sidebar layout */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'student', 'parent']} />}>
              <Route path="/setup" element={<FirstLoginSetup />} />
            </Route>

            {/* Settings — all authenticated roles (must be before role-specific blocks) */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'admin', 'teacher', 'student', 'parent']} />}>
              <Route element={<MainLayout />}>
                <Route path="/settings" element={<ProfileSettings />} />
              </Route>
            </Route>

            {/* Owner / Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/registration-requests" element={<RegistrationRequests />} />
                <Route path="/admin/students" element={<StudentList />} />
                <Route path="/admin/students/:id" element={<StudentProfile />} />
                <Route path="/admin/teachers" element={<TeacherList />} />
                <Route path="/admin/teachers/:id" element={<TeacherProfile />} />
                <Route path="/admin/parents" element={<ParentList />} />
                <Route path="/admin/parents/:id" element={<ParentProfile />} />
                <Route path="/admin/subjects" element={<SubjectList />} />
                <Route path="/admin/groups" element={<GroupList />} />
                <Route path="/admin/finance" element={<FinancialCenter />} />
                <Route path="/admin/schedule" element={<ScheduleList />} />
                <Route path="/admin/attendance" element={<AttendanceList />} />
                <Route path="/admin/grades" element={<GradeList />} />
                <Route path="/admin/payments" element={<FinancialCenter />} />
              </Route>
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route element={<MainLayout />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/groups" element={<TeacherGroups />} />
                <Route path="/teacher/groups/:id" element={<TeacherGroupDetail />} />
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
                <Route path="/student/schedule" element={<StudentSchedule />} />
                <Route path="/student/payments" element={<StudentPayments />} />
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
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
