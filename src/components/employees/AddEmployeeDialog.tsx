import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface FormData {
  name: string;
  email: string;
  designation: string;
  experience: string;
  primary_skill: string;
  secondary_skills: string;
  location: string;
  phone: string;
  status: string;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ mode: 'onChange' });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables');
      }
      // Create auth user via admin API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: 'ShadowEmp123!',
          email_confirm: true,
        }),
      });

      if (!response.ok) {
        let errMsg = `Failed to create user (status ${response.status})`;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const err = await response.json();
            errMsg = err.msg || err.message || JSON.stringify(err) || errMsg;
          } else {
            const txt = await response.text();
            if (txt) errMsg = txt;
          }
        } catch (e) {
          console.error('Error reading error response body', e);
        }
        console.error('Create user failed', { status: response.status, message: errMsg });
        throw new Error(errMsg);
      }

      const user = await response.json();

      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: data.email,
        name: data.name,
        role: 'employee',
        designation: data.designation || null,
        experience: data.experience ? parseFloat(data.experience) : 0,
        primary_skill: data.primary_skill || null,
        secondary_skills: data.secondary_skills ? data.secondary_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        location: data.location || null,
        phone: data.phone || null,
        status: data.status || 'bench',
      });

      if (profileError) throw profileError;

      toast.success('Employee added successfully');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add employee';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Name *</Label>
              <Input {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input {...register('designation')} placeholder="e.g. Senior Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input type="number" step="0.1" {...register('experience')} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Skill</Label>
              <Input {...register('primary_skill')} placeholder="e.g. React" />
            </div>
            <div className="space-y-2">
              <Label>Secondary Skills</Label>
              <Input {...register('secondary_skills')} placeholder="comma separated" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register('location')} placeholder="e.g. New York" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                {...register('phone', {
                  validate: (value) => {
                    if (!value) return true;
                    const normalized = value.replace(/[\s()-]/g, '');
                    return /^\+?[0-9]{7,10}$/.test(normalized) || 'Enter a valid phone number';
                  },
                })}
                placeholder="+1-555-0100"
              />
              {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select defaultValue="bench" {...register('status')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bench">Bench</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="shadow">Shadow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Employee'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
