import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      <Skeleton className="mb-4 h-10 w-64" />
      <Skeleton className="mb-10 h-5 w-full max-w-xl" />
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="h-80 rounded-2xl bg-slate-200" />
        <SkeletonList count={5} />
      </div>
    </main>
  );
}
