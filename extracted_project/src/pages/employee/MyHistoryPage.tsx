import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/PageHeader';
import { AllocationTypeBadge } from '@/components/shared/Badges';
import { Card } from '@/components/ui/card';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { AllocationHistory } from '@/lib/types';

export function MyHistoryPage() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('allocation_history')
        .select('*, project:projects(*)')
        .eq('employee_id', profile.id)
        .order('created_at', { ascending: false });
      if (!mounted) return;
      setHistory(data || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  return (
    <div>
      <PageHeader title="My History" description="Your complete allocation history and release dates" />

      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation %</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No history records found</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.project?.project_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium capitalize text-violet-700">{h.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.allocation_percentage ? `${h.allocation_percentage}%` : '—'}</td>
                    <td className="px-4 py-3">{h.allocation_type ? <AllocationTypeBadge type={h.allocation_type} /> : '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(h.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Release dates summary */}
      {history.length > 0 && (
        <Card className="mt-6 shadow-sm">
          <div className="p-5">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Release Dates</h3>
            <div className="space-y-2">
              {history
                .filter((h) => h.action === 'released' || h.action === 'completed')
                .map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{h.project?.project_name || '—'}</span>
                    <span className="text-muted-foreground">Released on {formatDate(h.created_at)}</span>
                  </div>
                ))}
              {history.filter((h) => h.action === 'released' || h.action === 'completed').length === 0 && (
                <p className="text-sm text-muted-foreground">No release dates recorded</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
