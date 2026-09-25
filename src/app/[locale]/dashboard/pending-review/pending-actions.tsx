import { Link } from '@/i18n/navigation';

export function PendingReviewActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link href="/projects" className="inline-flex items-center justify-center rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8]">
        تصفح المشاريع
      </Link>
      <Link href="/help" className="inline-flex items-center justify-center rounded-xl border border-[#2386c8]/25 bg-white px-6 py-3 text-sm font-bold text-[#2386c8] transition hover:bg-[#2386c8]/10">
        تواصل مع الدعم
      </Link>
    </div>
  );
}
