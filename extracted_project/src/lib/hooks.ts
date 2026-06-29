import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Project, Allocation, AllocationHistory } from '@/lib/types';

export function useAdminData() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [profilesRes, projectsRes, allocationsRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase
          .from('allocations')
          .select('*, employee:profiles!allocations_employee_id_fkey(*), project:projects(*), mentor:profiles!allocations_mentor_id_fkey(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('allocation_history')
          .select('*, employee:profiles!allocation_history_employee_id_fkey(*), project:projects(*), performer:profiles!allocation_history_performed_by_fkey(*)')
          .order('created_at', { ascending: false }),
      ]);

      if (!mounted) return;
      setProfiles(profilesRes.data || []);
      setProjects(projectsRes.data || []);
      setAllocations(allocationsRes.data || []);
      setHistory(historyRes.data || []);
      setLoading(false);
    })();
  }, []);

  return { profiles, projects, allocations, history, loading };
}

export function getEmployeeAllocation(allocations: Allocation[], employeeId: string): number {
  return allocations
    .filter((a) => a.employee_id === employeeId && a.status === 'active')
    .reduce((sum, a) => sum + a.allocation_percentage, 0);
}

export function getProjectAllocations(allocations: Allocation[], projectId: string): Allocation[] {
  return allocations.filter((a) => a.project_id === projectId && a.status === 'active');
}
