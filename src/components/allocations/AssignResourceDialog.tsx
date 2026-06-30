import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Profile, Project } from '@/lib/types';

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployee?: Profile | null;
  preselectedProject?: Project | null;
  onSuccess?: () => void;
}

export function AssignResourceDialog({ open, onOpenChange, preselectedEmployee, preselectedProject, onSuccess }: AssignResourceDialogProps) {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [allocationType, setAllocationType] = useState<'primary' | 'shadow'>('primary');
  const [mentorId, setMentorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      (async () => {
        const [empRes, projRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'employee').order('name'),
          supabase.from('projects').select('*').order('project_name'),
        ]);
        setEmployees(empRes.data || []);
        setProjects(projRes.data || []);

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
      setAllocationType('primary');
      setMentorId('');
      setStartDate('');
      setEndDate('');
      setNotes('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!employeeId || !projectId) {
      toast.error('Please fill in all required fields');
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
        allocation_percentage: 100,
        allocation_type: allocationType,
        mentor_id: allocationType === 'shadow' ? mentorId : null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'active',
        notes: notes || null,
      }).select().single();

      if (allocError) throw allocError;

      const { error: statusError } = await supabase
        .from('profiles')
        .update({ status: 'allocated' })
        .eq('id', employeeId);

      if (statusError) throw statusError;

      // Log to history
      await supabase.from('allocation_history').insert({
        allocation_id: alloc.id,
        employee_id: employeeId,
        project_id: projectId,
        action: 'allocated',
        allocation_percentage: 100,
        allocation_type: allocationType,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success('Resource assigned successfully');
      onSuccess?.();
      onOpenChange(false);
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

          <div className="space-y-2">
            <Label>Allocation Type</Label>
            <Select value={allocationType} onValueChange={(v) => setAllocationType(v as 'primary' | 'shadow')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="shadow">Shadow</SelectItem>
              </SelectContent>
            </Select>
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
