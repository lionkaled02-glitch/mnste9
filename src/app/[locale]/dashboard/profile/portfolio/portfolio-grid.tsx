'use client';

import { useState, useTransition } from 'react';

import { deletePortfolioItemAction, type PortfolioItemDTO } from '@/app/actions/portfolio';
import { PortfolioWorkForm } from '@/app/[locale]/dashboard/setup/steps/portfolio-work-form';

import { WorkDetailsModal } from './work-details-modal';

interface PortfolioGridProps {
  initialItems: PortfolioItemDTO[];
}

export function PortfolioGrid({ initialItems }: PortfolioGridProps) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PortfolioItemDTO | null>(null);
  const [isPending, startTransition] = useTransition();

  const remove = (id: number) => {
    if (!confirm('هل تريد حذف هذا العمل؟')) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const result = await deletePortfolioItemAction({ success: false }, formData);
      if (result.success) setItems((prev) => prev.filter((item) => item.id !== id));
      else alert(result.message ?? 'تعذر الحذف');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">معرض أعمالي</h1>
          <p className="mt-1 text-sm text-slate-500">اعرض أفضل أعمالك في صفحة مستقلة ومنظمة.</p>
        </div>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-[#2386c8] px-5 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">
          {showForm ? 'إخفاء النموذج' : 'إضافة عمل'}
        </button>
      </div>

      {showForm && (
        <PortfolioWorkForm onCreated={() => {
          window.location.reload();
        }} />
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2386c8]/10 text-3xl">🖼️</div>
          <h2 className="text-lg font-extrabold text-slate-900">لا توجد أعمال بعد</h2>
          <p className="mt-2 text-sm text-slate-500">أضف 3 صور على الأقل لأول عمل ليظهر هنا.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const cover = item.coverImageUrl ?? item.imageUrl ?? item.images?.[0];
            const count = item.images?.length ?? (cover ? 1 : 0);
            return (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-48 bg-slate-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">بدون صورة</div>
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700 shadow">{count} صور</div>
                  {item.attachmentUrl && <div className="absolute left-3 top-3 rounded-full bg-[#2386c8] px-3 py-1 text-xs font-bold text-white shadow">مرفق</div>}
                </div>
                <div className="p-5">
                  <h2 className="line-clamp-1 text-lg font-extrabold text-slate-900">{item.title}</h2>
                  <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{item.description || 'لا يوجد وصف'}</p>
                  <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => setSelected(item)} className="flex-1 rounded-xl bg-[#2386c8]/10 px-4 py-2.5 text-sm font-bold text-[#2386c8] hover:bg-[#2386c8]/15">التفاصيل</button>
                    <button type="button" disabled={isPending} onClick={() => remove(item.id)} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">حذف</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && <WorkDetailsModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
