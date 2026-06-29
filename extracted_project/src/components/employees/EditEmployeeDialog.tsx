import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

interface FormData {
  name: string;
  designation: string;
  experience: string;
  primary_skill: string;
  secondary_skills: string;
  location: string;
  phone: string;
  status: string;
}

interface EditEmployeeDialogProps {
  employee: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange }: EditEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (open) {
      reset({
        name: employee.name,
        designation: employee.designation || '',
        experience: String(employee.experience || ''),
        primary_skill: employee.primary_skill || '',
        secondary_skills: employee.secondary_skills.join(', '),
        location: employee.location || '',
        phone: employee.phone || '',
        status: employee.status,
      });
    }
  }, [open, employee, reset]);

  const statusValue = watch('status');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        name: data.name,
        designation: data.designation || null,
        experience: data.experience ? parseFloat(data.experience) : 0,
        primary_skill: data.primary_skill || null,
        secondary_skills: data.secondary_skills ? data.secondary_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        location: data.location || null,
        phone: data.phone || null,
        status: data.status,
      }).eq('id', employee.id);

      if (error) throw error;
      toast.success('Employee updated successfully');
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update employee';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee Name *</Label>
            <Input {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input {...register('designation')} />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input type="number" step="0.1" {...register('experience')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Skill</Label>
              <Input {...register('primary_skill')} />
            </div>
            <div className="space-y-2">
              <Label>Secondary Skills</Label>
              <Input {...register('secondary_skills')} placeholder="comma separated" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register('location')} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register('phone')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusValue} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bench">Bench</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="shadow">Shadow</SelectItem>
                <SelectItem value="partially_allocated">Partially Allocated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
