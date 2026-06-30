import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { EmployeesPage } from '@/pages/admin/EmployeesPage';
import { EmployeeDetailPage } from '@/pages/admin/EmployeeDetailPage';
import { ProjectsPage } from '@/pages/admin/ProjectsPage';
import { ProjectDetailPage } from '@/pages/admin/ProjectDetailPage';
import { AllocationBoardPage } from '@/pages/admin/AllocationBoardPage';
import { AllocationHistoryPage } from '@/pages/admin/AllocationHistoryPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { MyProfilePage } from '@/pages/employee/MyProfilePage';
import { MyProjectsPage } from '@/pages/employee/MyProjectsPage';
import { MyHistoryPage } from '@/pages/employee/MyHistoryPage';

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  if (!profile) return <LoadingScreen />;

  if (profile.role === 'admin') {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<EmployeesPage />} />
          <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/admin/projects" element={<ProjectsPage />} />
          <Route path="/admin/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/admin/allocation-board" element={<AllocationBoardPage />} />
          <Route path="/admin/allocation-history" element={<AllocationHistoryPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<MyProfilePage />} />
        <Route path="/employee/projects" element={<MyProjectsPage />} />
        <Route path="/employee/history" element={<MyHistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
    </Routes>
  );
}
