import { SkeletonList } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      <div className="animate-pulse">
        <div className="mb-6 h-10 w-1/3 rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="h-96 rounded-2xl bg-slate-200" />
        <SkeletonList count={3} />
      </div>
    </main>
  );
}
