import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  tone?: 'dark' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
}

const tones = {
  dark: 'bg-[#1a1a2e]/10 text-[#1a1a2e]',
  blue: 'bg-[#2386c8]/10 text-[#2386c8]',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
};

export function StatCard({ title, value, subtitle, icon, tone = 'dark' }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-extrabold text-[#1a1a2e]">{value}</p>
          {subtitle && <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon ?? <span className="text-xl">●</span>}
        </div>
      </div>
    </article>
  );
}
