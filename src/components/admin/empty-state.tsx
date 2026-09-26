interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export function EmptyState({ title, description, icon = '∅' }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a2e]/10 text-2xl text-[#1a1a2e]">{icon}</div>
      <h3 className="mt-4 text-base font-extrabold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
