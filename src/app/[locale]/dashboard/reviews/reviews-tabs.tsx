'use client';

import { useState } from 'react';

import type { ReviewListItem, ReviewsDashboardData } from '@/app/actions/reviews';

interface ReviewsTabsProps {
  data: ReviewsDashboardData;
}

export function ReviewsTabs({ data }: ReviewsTabsProps) {
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const list = tab === 'received' ? data.reviewsReceived : data.reviewsGiven;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">التقييمات</h1>
          <p className="mt-1 text-sm text-slate-500">متابعة التقييمات المستلمة والمرسلة بعد العقود المكتملة.</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-1">
          <button type="button" onClick={() => setTab('received')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'received' ? 'bg-white text-[#2386c8] shadow-sm' : 'text-slate-600'}`}>المستلمة</button>
          <button type="button" onClick={() => setTab('given')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'given' ? 'bg-white text-[#2386c8] shadow-sm' : 'text-slate-600'}`}>المرسلة</button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="متوسط التقييم" value={data.averageRating ? data.averageRating.toFixed(1) : '—'} />
          <Metric label="عدد التقييمات" value={String(data.reviewsCount)} />
          <Metric label="بانتظار تقييمك" value={String(data.pendingToReview.length)} />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2386c8]/10 text-3xl">★</div>
          <h2 className="text-lg font-extrabold text-slate-900">لا توجد تقييمات هنا</h2>
          <p className="mt-2 text-sm text-slate-500">ستظهر التقييمات بعد إكمال العقود.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#2386c8]">{value}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewListItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-lg font-extrabold text-[#2386c8]">{review.reviewerName.slice(0, 1)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-extrabold text-slate-900">{review.reviewerName}</h2>
            <time className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('ar')}</time>
          </div>
          <div className="mt-2 text-lg text-amber-400" aria-label={`${review.rating} من 5`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
          {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{review.comment}</p>}
          {review.contractId && <p className="mt-3 text-xs font-bold text-slate-400">العقد #{review.contractId}</p>}
        </div>
      </div>
    </article>
  );
}
