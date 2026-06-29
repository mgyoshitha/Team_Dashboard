import { Outlet } from 'react-router-dom';
import { LayoutDashboard, User, FolderKanban, History } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';

const navItems = [
  { label: 'Dashboard', to: '/employee/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Profile', to: '/employee/profile', icon: <User className="h-4 w-4" /> },
  { label: 'My Projects', to: '/employee/projects', icon: <FolderKanban className="h-4 w-4" /> },
  { label: 'My History', to: '/employee/history', icon: <History className="h-4 w-4" /> },
];

export function EmployeeLayout() {
  return (
    <DashboardLayout navItems={navItems} title="Employee Portal">
      <Outlet />
    </DashboardLayout>
  );
}
