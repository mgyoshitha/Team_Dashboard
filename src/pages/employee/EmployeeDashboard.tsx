import { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, UserCheck, Eye, CalendarClock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { AllocationTypeBadge, ProjectStatusBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Allocation, Profile } from '@/lib/types';

export function EmployeeDashboard() {
  const { profile } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Find mentor from shadow allocations
      const shadowWithMentor = (data || []).find((a) => a.allocation_type === 'shadow' && a.mentor);
      if (shadowWithMentor?.mentor) setMentor(shadowWithMentor.mentor);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">No profile found for the authenticated user.</p>
          <p className="text-sm">Create a `profiles` row linked to the user's `auth.users.id` in Supabase.</p>
        </div>
      </div>
    );
  }

  const activeAllocs = allocations.filter((a) => a.status === 'active');
  const totalAlloc = activeAllocs.reduce((sum, a) => sum + a.allocation_percentage, 0);
  const upcomingEndDates = activeAllocs
    .filter((a) => a.end_date)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader title={`Welcome, ${profile.name.split(' ')[0]}`} description="Here's an overview of your current allocations" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Status" value={profile.status.replace('_', ' ')} icon={<UserCheck className="h-6 w-6" />} />
        <StatCard label="Current Allocation" value={`${totalAlloc}%`} icon={<TrendingUp className="h-6 w-6" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard label="Active Projects" value={activeAllocs.length} icon={<Briefcase className="h-6 w-6" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="Mentor" value={mentor?.name || '—'} icon={<Eye className="h-6 w-6" />} iconBg="bg-amber-50 text-amber-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Current Projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {activeAllocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active project allocations</p>
            ) : (
              activeAllocs.map((a) => (
                <div key={a.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.project?.project_name}</p>
                      <p className="text-xs text-muted-foreground">{a.project?.client_name}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{a.allocation_percentage}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <AllocationTypeBadge type={a.allocation_type} />
                    <ProjectStatusBadge status={a.project?.status || 'planning'} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.start_date)} — {formatDate(a.end_date)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Upcoming End Dates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingEndDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming end dates</p>
            ) : (
              upcomingEndDates.map((a) => {
                const days = Math.ceil((new Date(a.end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                    <CalendarClock className="h-5 w-5 text-violet-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.project?.project_name}</p>
                      <p className="text-xs text-muted-foreground">Ends: {formatDate(a.end_date)}</p>
                    </div>
                    <span className={`text-sm font-medium ${days < 30 ? 'text-rose-500' : days < 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {days > 0 ? `${days} days left` : 'Ended'}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
