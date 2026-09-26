import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: React.ReactNode;
  status?: string | null;
  className?: string;
}

function tone(status?: string | null): string {
  switch (status) {
    case 'approved':
    case 'completed':
    case 'active':
    case 'open':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'pending':
    case 'pending_delivery':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'disputed':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'admin':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'freelancer':
      return 'border-[#2386c8]/20 bg-[#2386c8]/10 text-[#2386c8]';
    case 'client':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

export function StatusBadge({ children, status, className }: StatusBadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', tone(status), className)}>{children}</span>;
}
