import { useState, useMemo } from 'react';
import { Search, History } from 'lucide-react';
import { useAdminData } from '@/lib/hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import { AllocationTypeBadge } from '@/components/shared/Badges';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInitials, getAvatarColor, formatDateTime, cn } from '@/lib/utils';

export function AllocationHistoryPage() {
  const { history, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const matchesSearch = !search ||
        (h.employee?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.project?.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.performer?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesAction = actionFilter === 'all' || h.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [history, search, actionFilter]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  return (
    <div>
      <PageHeader title="Allocation History" description="Complete audit trail of all allocation activities" />

      <Card className="mb-4 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by employee, project, or changed by..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="allocated">Allocated</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation %</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Changed By</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <History className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-muted-foreground">No history records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold', getAvatarColor(h.employee?.name || 'U'))}>
                          {getInitials(h.employee?.name || 'U')}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{h.employee?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{h.project?.project_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium capitalize text-violet-700">{h.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.allocation_percentage ? `${h.allocation_percentage}%` : '—'}</td>
                    <td className="px-4 py-3">{h.allocation_type ? <AllocationTypeBadge type={h.allocation_type} /> : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{h.performer?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(h.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
