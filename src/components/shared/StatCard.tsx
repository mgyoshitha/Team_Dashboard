import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  trend?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-blue-50 text-blue-600', trend }: StatCardProps) {
  return (
    <Card className="p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
