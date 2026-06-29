import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Building2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProjectStatusBadge, PriorityBadge, AllocationTypeBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInitials, getAvatarColor, formatDate, cn } from '@/lib/utils';
import type { Project, Allocation } from '@/lib/types';

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const [projRes, allocRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('allocations')
          .select('*, employee:profiles!allocations_employee_id_fkey(*), mentor:profiles!allocations_mentor_id_fkey(*)')
          .eq('project_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      setProject(projRes.data as Project | null);
      setAllocations(allocRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  if (!project) {
    return <div className="text-center text-muted-foreground">Project not found</div>;
  }

  const activeAllocs = allocations.filter((a) => a.status === 'active');
  const primaryResources = activeAllocs.filter((a) => a.allocation_type === 'primary');
  const shadowResources = activeAllocs.filter((a) => a.allocation_type === 'shadow');
  const totalAlloc = activeAllocs.reduce((sum, a) => sum + a.allocation_percentage, 0);
  const utilization = activeAllocs.length > 0 ? Math.round(totalAlloc / (activeAllocs.length * 100) * 100) : 0;

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link to="/admin/projects"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link>
      </Button>

      <PageHeader
        title={project.project_name}
        description={project.description || ''}
        action={
          <div className="flex gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project info */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Project Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Client" value={project.client_name} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Manager" value={project.project_manager} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Start Date" value={formatDate(project.start_date)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="End Date" value={formatDate(project.end_date)} />
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Priority" value={project.priority} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Required Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.required_skills.length > 0 ? (
                  project.required_skills.map((s) => <span key={s} className="rounded-lg bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">{s}</span>)
                ) : (
                  <span className="text-sm text-muted-foreground">No required skills listed</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-violet-600">{utilization}%</p>
                <p className="mt-1 text-sm text-muted-foreground">Average per resource</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${utilization}%` }} />
                </div>
                <p className="mt-3 text-sm text-gray-600">{activeAllocs.length} active resources · {totalAlloc}% total allocation</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Primary Resources ({primaryResources.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {primaryResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No primary resources allocated</p>
              ) : (
                primaryResources.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                    <Link to={`/admin/employees/${a.employee_id}`} className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold', getAvatarColor(a.employee?.name || 'U'))}>
                      {getInitials(a.employee?.name || 'U')}
                    </Link>
                    <div className="flex-1">
                      <Link to={`/admin/employees/${a.employee_id}`} className="text-sm font-medium text-gray-900 hover:text-violet-600">
                        {a.employee?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.employee?.designation}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(a.start_date)} — {formatDate(a.end_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{a.allocation_percentage}%</p>
                      <AllocationTypeBadge type={a.allocation_type} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Shadow Resources ({shadowResources.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {shadowResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shadow resources allocated</p>
              ) : (
                shadowResources.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                    <Link to={`/admin/employees/${a.employee_id}`} className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold', getAvatarColor(a.employee?.name || 'U'))}>
                      {getInitials(a.employee?.name || 'U')}
                    </Link>
                    <div className="flex-1">
                      <Link to={`/admin/employees/${a.employee_id}`} className="text-sm font-medium text-gray-900 hover:text-violet-600">
                        {a.employee?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.employee?.designation}</p>
                      {a.mentor && <p className="mt-0.5 text-xs text-muted-foreground">Mentor: {a.mentor.name}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{a.allocation_percentage}%</p>
                      <AllocationTypeBadge type={a.allocation_type} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Project Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Start</p>
                    <p className="text-muted-foreground">{formatDate(project.start_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">End</p>
                    <p className="text-muted-foreground">{formatDate(project.end_date)}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400" style={{ width: '100%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-medium text-gray-900 capitalize">{value || '—'}</span>
    </div>
  );
}
