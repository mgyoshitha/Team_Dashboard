import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Award, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatusBadge, AllocationTypeBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInitials, getAvatarColor, formatDate, cn } from '@/lib/utils';
import type { Profile, Allocation, AllocationHistory } from '@/lib/types';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Profile | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const [empRes, allocRes, histRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('allocations')
          .select('*, project:projects(*), mentor:profiles!allocations_mentor_id_fkey(*)')
          .eq('employee_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('allocation_history')
          .select('*, project:projects(*)')
          .eq('employee_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      setEmployee(empRes.data as Profile | null);
      setAllocations(allocRes.data || []);
      setHistory(histRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground">Employee not found</div>;
  }

  const activeAllocations = allocations.filter((a) => a.status === 'active');
  const totalAlloc = activeAllocations.reduce((sum, a) => sum + a.allocation_percentage, 0);

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link to="/admin/employees"><ArrowLeft className="h-4 w-4" /> Back to Employees</Link>
      </Button>

      {/* Header card */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold', getAvatarColor(employee.name))}>
              {getInitials(employee.name)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-sm text-muted-foreground">{employee.designation || '—'}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{employee.email}</span>
                {employee.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{employee.phone}</span>}
                {employee.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{employee.location}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={employee.status} />
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{totalAlloc}%</p>
                <p className="text-xs text-muted-foreground">Total Allocation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Employee info */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Employee Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Designation" value={employee.designation} />
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Experience" value={`${employee.experience || 0} years`} />
              <InfoRow icon={<Award className="h-4 w-4" />} label="Primary Skill" value={employee.primary_skill} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={employee.location} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {employee.primary_skill && <span className="rounded-lg bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">{employee.primary_skill}</span>}
                {employee.secondary_skills.map((s) => <span key={s} className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600">{s}</span>)}
                {!employee.primary_skill && employee.secondary_skills.length === 0 && <span className="text-sm text-muted-foreground">No skills listed</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Projects + History */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Current Projects</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activeAllocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active project allocations</p>
              ) : (
                activeAllocations.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                    <div className="flex-1">
                      <Link to={`/admin/projects/${a.project_id}`} className="text-sm font-medium text-gray-900 hover:text-violet-600">
                        {a.project?.project_name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <AllocationTypeBadge type={a.allocation_type} />
                        {a.mentor && <span className="text-xs text-muted-foreground">Mentor: {a.mentor.name}</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.start_date)} — {formatDate(a.end_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{a.allocation_percentage}%</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Allocation History</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No allocation history</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 capitalize">{h.action}</span>
                        <span className="text-muted-foreground"> to {h.project?.project_name || '—'}</span>
                        {h.allocation_percentage && <span className="text-muted-foreground"> at {h.allocation_percentage}%</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
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
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}
