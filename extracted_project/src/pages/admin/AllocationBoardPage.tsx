import { useState, useEffect } from 'react';
import { Plus, Users, FolderKanban, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssignResourceDialog } from '@/components/allocations/AssignResourceDialog';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Profile, Project, Allocation } from '@/lib/types';

export function AllocationBoardPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [empRes, projRes, allocRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'employee').order('name'),
        supabase.from('projects').select('*').order('project_name'),
        supabase
          .from('allocations')
          .select('*, employee:profiles!allocations_employee_id_fkey(*), project:projects(*), mentor:profiles!allocations_mentor_id_fkey(*)')
          .eq('status', 'active'),
      ]);
      if (!mounted) return;
      setEmployees(empRes.data || []);
      setProjects(projRes.data || []);
      setAllocations(allocRes.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  const getEmployeeAlloc = (id: string) => allocations.filter((a) => a.employee_id === id).reduce((s, a) => s + a.allocation_percentage, 0);
  const getProjectAllocs = (id: string) => allocations.filter((a) => a.project_id === id);

  const filteredEmployees = employees.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.primary_skill || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Allocation Board"
        description="Assign resources to projects and manage allocations"
        action={
          <Button onClick={() => { setSelectedEmployee(null); setSelectedProject(null); setAssignOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Assign Resource
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Employees */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Available Employees ({filteredEmployees.length})</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] space-y-2 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <Users className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-muted-foreground">No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((e) => {
                const alloc = getEmployeeAlloc(e.id);
                const empAllocs = allocations.filter((a) => a.employee_id === e.id);
                return (
                  <div key={e.id} className="rounded-lg border border-gray-100 p-3 hover:border-violet-200 hover:bg-violet-50/30">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold', getAvatarColor(e.name))}>
                        {getInitials(e.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{e.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.primary_skill || '—'}</p>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div className={cn('h-full rounded-full', alloc >= 100 ? 'bg-emerald-500' : alloc > 0 ? 'bg-violet-500' : 'bg-gray-300')} style={{ width: `${alloc}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{alloc}%</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => { setSelectedEmployee(e); setSelectedProject(null); setAssignOpen(true); }}
                      >
                        <Plus className="h-3 w-3" /> Assign
                      </Button>
                    </div>
                    {empAllocs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {empAllocs.map((a) => (
                          <span key={a.id} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {a.project?.project_name} · {a.allocation_percentage}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] space-y-2 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <FolderKanban className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-muted-foreground">No projects found</p>
              </div>
            ) : (
              projects.map((p) => {
                const projAllocs = getProjectAllocs(p.id);
                const primary = projAllocs.filter((a) => a.allocation_type === 'primary');
                const shadow = projAllocs.filter((a) => a.allocation_type === 'shadow');
                return (
                  <div key={p.id} className="rounded-lg border border-gray-100 p-3 hover:border-violet-200 hover:bg-violet-50/30">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{p.project_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.client_name}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => { setSelectedProject(p); setSelectedEmployee(null); setAssignOpen(true); }}
                      >
                        <Plus className="h-3 w-3" /> Assign
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Primary ({primary.length})</p>
                        <div className="space-y-1">
                          {primary.map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1">
                              <div className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold', getAvatarColor(a.employee?.name || 'U'))}>
                                {getInitials(a.employee?.name || 'U')}
                              </div>
                              <span className="truncate text-xs text-gray-700">{a.employee?.name}</span>
                              <span className="ml-auto text-xs font-medium text-violet-700">{a.allocation_percentage}%</span>
                            </div>
                          ))}
                          {primary.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Shadow ({shadow.length})</p>
                        <div className="space-y-1">
                          {shadow.map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1">
                              <div className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold', getAvatarColor(a.employee?.name || 'U'))}>
                                {getInitials(a.employee?.name || 'U')}
                              </div>
                              <span className="truncate text-xs text-gray-700">{a.employee?.name}</span>
                              <span className="ml-auto text-xs font-medium text-amber-700">{a.allocation_percentage}%</span>
                            </div>
                          ))}
                          {shadow.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <AssignResourceDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        preselectedEmployee={selectedEmployee}
        preselectedProject={selectedProject}
      />
    </div>
  );
}
