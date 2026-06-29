import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Grid3x3, History, ChartBar as BarChart3 } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Employees', to: '/admin/employees', icon: <Users className="h-4 w-4" /> },
  { label: 'Projects', to: '/admin/projects', icon: <FolderKanban className="h-4 w-4" /> },
  { label: 'Allocation Board', to: '/admin/allocation-board', icon: <Grid3x3 className="h-4 w-4" /> },
  { label: 'Allocation History', to: '/admin/allocation-history', icon: <History className="h-4 w-4" /> },
  { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
];

export function AdminLayout() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <Outlet />
    </DashboardLayout>
  );
}
