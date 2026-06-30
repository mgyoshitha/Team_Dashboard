import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

interface DeleteEmployeeDialogProps {
  employee: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteEmployeeDialog({ employee, open, onOpenChange, onSuccess }: DeleteEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables');
      }
      // Try to lookup auth user by email first (more reliable than trusting profile.id)
      console.debug('Looking up auth user by email', { email: employee.email });
      const lookupUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(
        String(employee.email)
      )}`;
      const lookupRes = await fetch(lookupUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      });

      let authUserId: string | null = null;
      if (lookupRes.ok) {
        try {
          const list = await lookupRes.json();
          console.debug('Lookup result', list);
          if (Array.isArray(list) && list.length > 0) {
            authUserId = list[0].id;
          } else if (list && typeof list === 'object' && (list.id || list.user)) {
            authUserId = list.id || list.user?.id || null;
          }
        } catch (e) {
          console.error('Failed parsing lookup response', e);
        }
      } else {
        console.warn('Lookup request failed', { status: lookupRes.status });
      }

      const userId = authUserId || String(employee.id).trim();
      console.debug('Deleting auth user', { userId });
      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${userId}`;
      console.debug('Delete URL', url);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      });

      if (!response.ok) {
        let errMsg = `Failed to delete user (status ${response.status})`;
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
        console.error('Delete user failed', { status: response.status, message: errMsg });
        throw new Error(errMsg);
      }

      toast.success('Employee deleted successfully');
      onSuccess?.();
      onOpenChange(false);
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
