export interface LocalPortfolioWork {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  imagesCount: number;
  attachmentUrl?: string;
}

interface PortfolioWorkCardProps {
  work: LocalPortfolioWork;
}

export function PortfolioWorkCard({ work }: PortfolioWorkCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={work.coverUrl} alt={work.title} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-extrabold text-slate-900">{work.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">{work.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span className="rounded-full bg-[#2386c8]/10 px-2.5 py-1 text-[#2386c8]">{work.imagesCount} صور</span>
          {work.attachmentUrl && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">ملف مرفق</span>}
        </div>
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <button type="button" disabled className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-400">تعديل</button>
          <button type="button" disabled className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-300">حذف</button>
        </div>
      </div>
    </article>
  );
}
