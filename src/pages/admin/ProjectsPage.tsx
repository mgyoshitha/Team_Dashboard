import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Calendar } from 'lucide-react';
import { useAdminData, getProjectAllocations } from '@/lib/hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProjectStatusBadge, PriorityBadge } from '@/components/shared/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { supabase } from '@/lib/supabase';
import { formatDate, normalizeProjectStatus, mapProjectStatusToStore } from '@/lib/utils';
import type { Project, ProjectType } from '@/lib/types';

type ProjectTab = 'project' | 'accelerator' | 'poc';

const tabConfig: Array<{ value: ProjectTab; label: string }> = [
  { value: 'project', label: 'Projects' },
  { value: 'accelerator', label: 'Accelerators' },
  { value: 'poc', label: 'POC' },
];

export function ProjectsPage() {
  const { projects, allocations, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ProjectTab>('project');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectsList, setProjectsList] = useState(projects);

  useEffect(() => {
    setProjectsList(projects);
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projectsList.filter((p) => {
      const projectType = (p.project_type || 'project') as ProjectType;
      if (projectType !== activeTab) return false;

      return !search ||
        p.project_name.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.project_manager || '').toLowerCase().includes(search.toLowerCase());
    });

    if (statusFilter !== 'all') {
      result = result.filter((p) => normalizeProjectStatus(p.status) === statusFilter);
    }

    return result;
  }, [activeTab, projectsList, search, statusFilter]);

  const handleProjectSuccess = (project: Project) => {
    setProjectsList((prevProjects) => [project, ...prevProjects.filter((p) => p.id !== project.id)]);
  };

  const handleStatusChange = async (projectId: string, status: string) => {
    const { error } = await supabase.from('projects').update({ status: mapProjectStatusToStore(status) }).eq('id', projectId);
    if (error) {
      console.error(error);
      return;
    }

    // Update local state immediately
    setProjectsList(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, status: normalizeProjectStatus(status) }
          : p
      )
    );
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  const activeTabLabel = tabConfig.find((tab) => tab.value === activeTab)?.label ?? 'Projects';

  return (
    <div>
      <PageHeader
        title={activeTabLabel}
        description={`${filtered.length} ${activeTabLabel.toLowerCase()} across your organization`}
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create {activeTabLabel}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProjectTab)} className="mb-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {tabConfig.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-4 flex gap-4">
        <Card className="flex-1 p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by project name, client, or manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="p-4 shadow-sm">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-muted-foreground">No projects found</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((p) => {
            const projectAllocs = getProjectAllocations(allocations, p.id);
            const primaryCount = projectAllocs.filter((a) => a.allocation_type === 'primary').length;
            const shadowCount = projectAllocs.filter((a) => a.allocation_type === 'shadow').length;
            const skillPreview = p.required_skills.slice(0, 3);

            return (
              <Card key={p.id} className="group h-full border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/projects/${p.id}`} className="text-lg font-semibold text-slate-900 transition hover:text-violet-600">
                        {p.project_name}
                      </Link>
                      <p className="mt-1 text-sm font-medium text-slate-600">{p.client_name}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <ProjectStatusBadge status={p.status} />
                      <PriorityBadge priority={p.priority} />
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {p.description || 'No project description yet.'}
                  </p>

                  <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Manager</p>
                      <p className="mt-1 font-medium text-slate-700">{p.project_manager || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Allocation</p>
                      <p className="mt-1 font-medium text-slate-700">{primaryCount} primary · {shadowCount} shadow</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4 text-violet-500" />
                      <span>{formatDate(p.start_date)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skillPreview.length > 0 ? (
                        skillPreview.map((skill) => (
                          <span key={skill} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No skills listed</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link to={`/admin/projects/${p.id}`} className="text-sm font-medium text-violet-600 transition hover:text-violet-700">
                      Open project
                    </Link>
                    <Select value={normalizeProjectStatus(p.status)} onValueChange={(status) => handleStatusChange(p.id, status)}>
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleProjectSuccess} defaultProjectType={activeTab} />
    </div>
  );
}
