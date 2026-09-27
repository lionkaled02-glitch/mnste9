import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      <Skeleton className="mb-3 h-5 w-24" />
      <Skeleton className="mb-8 h-10 w-56" />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="h-[32rem] rounded-2xl bg-slate-200" />
        <SkeletonList count={4} />
      </div>
    </main>
  );
}
