import { Download, Users, Coffee, FolderKanban } from 'lucide-react';
import { useAdminData, getEmployeeAllocation, getProjectAllocations } from '@/lib/hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadCSV, getInitials, getAvatarColor, cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

const PIE_COLORS = ['#6C4CF1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export function ReportsPage() {
  const { profiles, projects, allocations, loading } = useAdminData();

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  }

  const employees = profiles.filter((p) => p.role === 'employee');

  // Employee utilization data
  const utilizationData = employees.map((e) => ({
    name: e.name,
    allocation: getEmployeeAllocation(allocations, e.id),
    status: e.status,
  }));

  // Bench resources
  const benchResources = employees.filter((e) => e.status === 'bench');

  // Project allocation data
  const projectAllocData = projects.map((p) => ({
    name: p.project_name,
    primary: getProjectAllocations(allocations, p.id).filter((a) => a.allocation_type === 'primary').length,
    shadow: getProjectAllocations(allocations, p.id).filter((a) => a.allocation_type === 'shadow').length,
  }));

  // Status distribution
  const statusDist = [
    { name: 'Allocated', value: employees.filter((e) => e.status === 'allocated' || getEmployeeAllocation(allocations, e.id) > 0).length },
    { name: 'Bench', value: employees.filter((e) => e.status === 'bench').length },
    { name: 'Shadow', value: employees.filter((e) => e.status === 'shadow').length },
  ];

  const downloadUtilization = () => {
    const rows = utilizationData.map((d) => ({ Employee: d.name, 'Allocation %': d.allocation, Status: d.status }));
    downloadCSV('employee_utilization_report.csv', rows);
    toast.success('Report downloaded');
  };

  const downloadBench = () => {
    const rows = benchResources.map((e) => ({
      Name: e.name, Email: e.email, Designation: e.designation || '',
      'Primary Skill': e.primary_skill || '', Location: e.location || '', Experience: e.experience || 0,
    }));
    downloadCSV('bench_resources_report.csv', rows);
    toast.success('Report downloaded');
  };

  const downloadProjectAlloc = () => {
    const rows = projectAllocData.map((d) => ({ Project: d.name, 'Primary Resources': d.primary, 'Shadow Resources': d.shadow, Total: d.primary + d.shadow }));
    downloadCSV('project_allocation_report.csv', rows);
    toast.success('Report downloaded');
  };

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and downloadable reports for resource management" />

      {/* Employee Utilization Report */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Employee Utilization Report</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={downloadUtilization} className="gap-2">
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="allocation" name="Allocation %" radius={[0, 6, 6, 0]} fill="#6C4CF1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bench Resources Report */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-base">Bench Resources Report</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={downloadBench} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{benchResources.length}</p>
                <p className="text-sm text-muted-foreground">Employees on bench</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {benchResources.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold', getAvatarColor(e.name))}>
                    {getInitials(e.name)}
                  </div>
                  <span className="font-medium text-gray-900">{e.name}</span>
                  <span className="text-muted-foreground">· {e.primary_skill || '—'}</span>
                </div>
              ))}
              {benchResources.length === 0 && <p className="text-sm text-muted-foreground">No bench resources</p>}
            </div>
          </CardContent>
        </Card>

        {/* Project Allocation Report */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Project Allocation Report</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={downloadProjectAlloc} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectAllocData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="primary" name="Primary" stackId="a" fill="#6C4CF1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="shadow" name="Shadow" stackId="a" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
