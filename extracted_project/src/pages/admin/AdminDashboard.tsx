import { Users, FolderKanban, UserCheck, Coffee, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ProjectStatusBadge, AllocationTypeBadge } from '@/components/shared/Badges';
import { useAdminData, getEmployeeAllocation, getProjectAllocations } from '@/lib/hooks';
import { getInitials, getAvatarColor, formatDate, cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from 'recharts';

export function AdminDashboard() {
  const { profiles, projects, allocations, history, loading } = useAdminData();

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  const employees = profiles.filter((p) => p.role === 'employee');
  const activeProjects = projects.filter((p) => p.status === 'active');
  const allocatedEmployees = employees.filter((e) => {
    const alloc = getEmployeeAllocation(allocations, e.id);
    return alloc > 0 && alloc < 100;
  });
  const benchEmployees = employees.filter((e) => e.status === 'bench');
  const shadowEmployees = employees.filter((e) => e.status === 'shadow');
  const totalAllocation = employees.reduce((sum, e) => sum + getEmployeeAllocation(allocations, e.id), 0);
  const utilization = employees.length > 0 ? Math.round((totalAllocation / (employees.length * 100)) * 100) : 0;

  // Project distribution data
  const projectDistData = projects.map((p) => ({
    name: p.project_name,
    value: getProjectAllocations(allocations, p.id).length,
  })).filter((d) => d.value > 0);

  const PIE_COLORS = ['#6C4CF1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

  // Employee status data
  const statusData = [
    { name: 'Allocated', value: employees.filter((e) => e.status === 'allocated').length, fill: '#10B981' },
    { name: 'Bench', value: benchEmployees.length, fill: '#9CA3AF' },
    { name: 'Shadow', value: shadowEmployees.length, fill: '#F59E0B' },
    { name: 'Partial', value: employees.filter((e) => e.status === 'partially_allocated').length, fill: '#3B82F6' },
  ];

  const recentAllocations = allocations.slice(0, 5);
  const recentProjects = projects.slice(0, 4);
  const recentHistory = history.slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your organization's resource allocation" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Employees" value={employees.length} icon={<Users className="h-6 w-6" />} />
        <StatCard label="Active Projects" value={activeProjects.length} icon={<FolderKanban className="h-6 w-6" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard label="Allocated" value={allocatedEmployees.length} icon={<UserCheck className="h-6 w-6" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="Bench" value={benchEmployees.length} icon={<Coffee className="h-6 w-6" />} iconBg="bg-gray-100 text-gray-600" />
        <StatCard label="Shadow" value={shadowEmployees.length} icon={<Eye className="h-6 w-6" />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard label="Utilization" value={`${utilization}%`} icon={<TrendingUp className="h-6 w-6" />} iconBg="bg-violet-50 text-violet-600" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Project Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {projectDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={projectDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {projectDistData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No allocation data</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Employee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent sections */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Recent Allocations */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Allocations</CardTitle>
            <Link to="/admin/allocation-board" className="text-xs font-medium text-violet-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAllocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allocations yet</p>
            ) : (
              recentAllocations.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold', getAvatarColor(a.employee?.name || 'U'))}>
                    {getInitials(a.employee?.name || 'U')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{a.employee?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.project?.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AllocationTypeBadge type={a.allocation_type} />
                    <span className="text-sm font-semibold text-gray-900">{a.allocation_percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Link to="/admin/projects" className="text-xs font-medium text-violet-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              recentProjects.map((p) => (
                <Link key={p.id} to={`/admin/projects/${p.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{p.project_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.client_name} · {formatDate(p.start_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProjectStatusBadge status={p.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="mt-6 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Activities</CardTitle>
          <Link to="/admin/allocation-history" className="text-xs font-medium text-violet-600 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            recentHistory.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', getAvatarColor(h.employee?.name || 'U'))}>
                  <span className="text-xs font-semibold">{getInitials(h.employee?.name || 'U')}</span>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{h.employee?.name}</span>
                  <span className="text-muted-foreground"> was {h.action} to </span>
                  <span className="font-medium text-gray-900">{h.project?.project_name}</span>
                  <span className="text-muted-foreground"> at {h.allocation_percentage}%</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
