import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface FormData {
  project_name: string;
  client_name: string;
  description: string;
  project_manager: string;
  start_date: string;
  end_date: string;
  required_skills: string;
  priority: string;
  status: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { priority: 'medium', status: 'planning' },
  });

  useEffect(() => {
    if (open) reset({ priority: 'medium', status: 'planning' });
  }, [open, reset]);

  const priorityValue = watch('priority');
  const statusValue = watch('status');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('projects').insert({
        project_name: data.project_name,
        client_name: data.client_name,
        description: data.description || null,
        project_manager: data.project_manager || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        required_skills: data.required_skills ? data.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        priority: data.priority,
        status: data.status,
      });

      if (error) throw error;
      toast.success('Project created successfully');
      onOpenChange(false);
      reset();
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input {...register('project_name', { required: 'Project name is required' })} />
            {errors.project_name && <p className="text-xs text-rose-500">{errors.project_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Client *</Label>
            <Input {...register('client_name', { required: 'Client is required' })} />
            {errors.client_name && <p className="text-xs text-rose-500">{errors.client_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Project Manager</Label>
            <Input {...register('project_manager')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" {...register('end_date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Required Skills</Label>
            <Input {...register('required_skills')} placeholder="comma separated, e.g. React, Python, AWS" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityValue} onValueChange={(v) => setValue('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusValue} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
