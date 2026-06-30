import { cn, normalizeProjectStatus } from '@/lib/utils';
import type { EmployeeStatus, ProjectStatus, AllocationType, ProjectPriority } from '@/lib/types';

const employeeStatusStyles: Record<EmployeeStatus, string> = {
  bench: 'bg-gray-100 text-gray-700',
  allocated: 'bg-emerald-100 text-emerald-700',
  shadow: 'bg-amber-100 text-amber-700',
};

const projectStatusStyles: Record<ProjectStatus, string> = {
  backlog: 'bg-slate-100 text-slate-700',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-700',
};

const allocationTypeStyles: Record<AllocationType, string> = {
  primary: 'bg-violet-100 text-violet-700',
  shadow: 'bg-amber-100 text-amber-700',
};

const priorityStyles: Record<ProjectPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
};

export function StatusBadge({ status }: { status: EmployeeStatus | string }) {
  const normalizedStatus = status === 'partially_allocated' ? 'allocated' : status;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', employeeStatusStyles[normalizedStatus as EmployeeStatus])}>
      {normalizedStatus === 'allocated' ? 'Allocated' : String(normalizedStatus).replace('_', ' ')}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus | string }) {
  const normalizedStatus = normalizeProjectStatus(status);

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', projectStatusStyles[normalizedStatus as ProjectStatus])}>
      {String(normalizedStatus).replace('_', ' ')}
    </span>
  );
}

export function AllocationTypeBadge({ type }: { type: AllocationType }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', allocationTypeStyles[type])}>
      {type}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', priorityStyles[priority])}>
      {priority}
    </span>
  );
}
