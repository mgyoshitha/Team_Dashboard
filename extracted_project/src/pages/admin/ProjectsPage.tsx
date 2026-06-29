import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Calendar, User, ArrowRight } from 'lucide-react';
import { useAdminData, getProjectAllocations } from '@/lib/hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProjectStatusBadge, PriorityBadge } from '@/components/shared/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { formatDate } from '@/lib/utils';

export function ProjectsPage() {
  const { projects, allocations, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = !search ||
        p.project_name.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.project_manager || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.length} projects across your organization`}
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
      />

      <Card className="mb-4 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by project name, client, or manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const projectAllocs = getProjectAllocations(allocations, p.id);
            const primaryCount = projectAllocs.filter((a) => a.allocation_type === 'primary').length;
            const shadowCount = projectAllocs.filter((a) => a.allocation_type === 'shadow').length;
            return (
              <Link key={p.id} to={`/admin/projects/${p.id}`}>
                <Card className="h-full shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-violet-600">{p.project_name}</h3>
                        <p className="text-sm text-muted-foreground">{p.client_name}</p>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description || 'No description'}</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.required_skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">{s}</span>
                      ))}
                      {p.required_skills.length > 3 && <span className="text-xs text-muted-foreground">+{p.required_skills.length - 3}</span>}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3.5 w-3.5" />Manager</span>
                        <span className="font-medium text-gray-700">{p.project_manager || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Timeline</span>
                        <span className="font-medium text-gray-700">{formatDate(p.start_date)} → {formatDate(p.end_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Resources</span>
                        <span className="font-medium text-gray-700">{primaryCount} primary · {shadowCount} shadow</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <PriorityBadge priority={p.priority} />
                      <span className="flex items-center gap-1 text-xs font-medium text-violet-600">View details <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
