'use client';

import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
      {icon && <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">{icon}</div>}
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className="inline-flex rounded-xl bg-[#2386c8] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1a6da8]">
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex rounded-xl bg-[#2386c8] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1a6da8]"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
