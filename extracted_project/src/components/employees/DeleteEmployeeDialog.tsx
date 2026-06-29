import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

interface DeleteEmployeeDialogProps {
  employee: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEmployeeDialog({ employee, open, onOpenChange }: DeleteEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete auth user via admin API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/user/${employee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.msg || err.message || 'Failed to delete user');
      }

      toast.success('Employee deleted successfully');
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete employee';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-gray-900">{employee.name}</span>?
            This will also remove all their allocations and history. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
