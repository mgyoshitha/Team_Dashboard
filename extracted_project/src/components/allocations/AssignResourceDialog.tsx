import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Profile, Project, Allocation } from '@/lib/types';

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployee?: Profile | null;
  preselectedProject?: Project | null;
}

export function AssignResourceDialog({ open, onOpenChange, preselectedEmployee, preselectedProject }: AssignResourceDialogProps) {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [percentage, setPercentage] = useState('');
  const [allocationType, setAllocationType] = useState<'primary' | 'shadow'>('primary');
  const [mentorId, setMentorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      (async () => {
        const [empRes, projRes, allocRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'employee').order('name'),
          supabase.from('projects').select('*').order('project_name'),
          supabase.from('allocations').select('*').eq('status', 'active'),
        ]);
        setEmployees(empRes.data || []);
        setProjects(projRes.data || []);
        setAllocations(allocRes.data || []);

        if (preselectedEmployee) setEmployeeId(preselectedEmployee.id);
        if (preselectedProject) setProjectId(preselectedProject.id);
      })();
    }
  }, [open, preselectedEmployee, preselectedProject]);

  // Reset fields when closed
  useEffect(() => {
    if (!open) {
      setEmployeeId('');
      setProjectId('');
      setPercentage('');
      setAllocationType('primary');
      setMentorId('');
      setStartDate('');
      setEndDate('');
      setNotes('');
    }
  }, [open]);

  const currentAlloc = employeeId
    ? allocations.filter((a) => a.employee_id === employeeId).reduce((sum, a) => sum + a.allocation_percentage, 0)
    : 0;

  const handleSubmit = async () => {
    if (!employeeId || !projectId || !percentage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const pct = parseInt(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Allocation percentage must be between 0 and 100');
      return;
    }

    if (currentAlloc + pct > 100) {
      toast.error(`Total allocation would exceed 100%. Current: ${currentAlloc}%, attempting to add: ${pct}%`);
      return;
    }

    if (allocationType === 'shadow' && !mentorId) {
      toast.error('Mentor is required for shadow allocations');
      return;
    }

    setLoading(true);
    try {
      const { data: alloc, error: allocError } = await supabase.from('allocations').insert({
        employee_id: employeeId,
        project_id: projectId,
        allocation_percentage: pct,
        allocation_type: allocationType,
        mentor_id: allocationType === 'shadow' ? mentorId : null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'active',
        notes: notes || null,
      }).select().single();

      if (allocError) throw allocError;

      // Log to history
      await supabase.from('allocation_history').insert({
        allocation_id: alloc.id,
        employee_id: employeeId,
        project_id: projectId,
        action: 'allocated',
        allocation_percentage: pct,
        allocation_type: allocationType,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success('Resource assigned successfully');
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign resource';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {employeeId && (
              <p className="text-xs text-muted-foreground">Current allocation: {currentAlloc}%</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Allocation Percentage *</Label>
              <Input type="number" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 50" />
              {employeeId && percentage && (
                <p className={cn('text-xs', currentAlloc + parseInt(percentage || '0') > 100 ? 'text-rose-500' : 'text-muted-foreground')}>
                  Total after assign: {currentAlloc + (parseInt(percentage) || 0)}%
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Allocation Type *</Label>
              <Select value={allocationType} onValueChange={(v) => setAllocationType(v as 'primary' | 'shadow')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="shadow">Shadow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {allocationType === 'shadow' && (
            <div className="space-y-2">
              <Label>Mentor * <span className="text-xs text-rose-500">(required for shadow)</span></Label>
              <Select value={mentorId} onValueChange={setMentorId}>
                <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.id !== employeeId).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save Allocation'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
