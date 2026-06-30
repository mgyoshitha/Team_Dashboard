import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/PageHeader';
import { AllocationTypeBadge, ProjectStatusBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Allocation } from '@/lib/types';

export function MyProjectsPage() {
  const { profile } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('allocations')
        .select('*, project:projects(*), mentor:profiles!allocations_mentor_id_fkey(*)')
        .eq('employee_id', profile.id)
        .order('created_at', { ascending: false });
      if (!mounted) return;
      setAllocations(data || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  const active = allocations.filter((a) => a.status === 'active');
  const past = allocations.filter((a) => a.status !== 'active');

  return (
    <div>
      <PageHeader title="My Projects" description="Projects you are currently allocated to" />

      <Card className="mb-6 shadow-sm">
        <CardHeader><CardTitle className="text-base">Active Projects ({active.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active project allocations</p>
          ) : (
            active.map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.project?.project_name}</p>
                    <p className="text-xs text-muted-foreground">{a.project?.client_name}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{a.allocation_percentage}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AllocationTypeBadge type={a.allocation_type} />
                  <ProjectStatusBadge status={a.project?.status || 'planning'} />
                  {a.mentor && <span className="text-xs text-muted-foreground">Mentor: {a.mentor.name}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(a.start_date)} — {formatDate(a.end_date)}</span>
                  {a.notes && <span className="italic">"{a.notes}"</span>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Past Projects ({past.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {past.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 opacity-75">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.project?.project_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.start_date)} — {formatDate(a.end_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <AllocationTypeBadge type={a.allocation_type} />
                  <span className="text-sm font-medium text-gray-600">{a.allocation_percentage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
