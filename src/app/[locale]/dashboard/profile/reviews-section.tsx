/**
 * خدمات — أقسام التقييمات داخل الملف الشخصي
 */

import { getMyReviewsDashboard, submitReviewAction, type ReviewListItem } from '@/app/actions/reviews';
import { formatDate } from '@/lib/utils';

function Stars({ rating }: { rating: number }) {
  return (
    <span dir="ltr" aria-label={`${rating} من 5`} className="inline-flex text-amber-400">
      {'★'.repeat(rating)}<span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

function ReviewCard({ review, nameLabel }: { review: ReviewListItem; nameLabel: string }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{nameLabel}: {review.reviewerName}</p>
          <p className="mt-1 text-[11px] text-slate-500">{formatDate(review.createdAt)}</p>
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{review.comment}</p>}
    </article>
  );
}

export async function ReviewsGivenSection() {
  const { reviewsGiven, pendingToReview } = await getMyReviewsDashboard();

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-[18px] font-bold text-[#222]">التقييمات المُعطاة</h2>
        <p className="mt-1 text-[12px] text-[#666]">قيّم الأطراف الأخرى بعد العقود المكتملة، وراجع التقييمات التي أرسلتها.</p>
      </div>

      {pendingToReview.length > 0 && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">بانتظار تقييمك</h3>
          <div className="space-y-3">
            {pendingToReview.map((target) => (
              <form key={target.contractId} action={submitReviewAction} className="rounded-lg border border-amber-100 bg-white p-4">
                <input type="hidden" name="contractId" value={target.contractId} />
                <input type="hidden" name="reviewedId" value={target.reviewedId} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{target.projectTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">قيّم: {target.reviewedName} — اكتمل في {formatDate(target.completedAt)}</p>
                  </div>
                  <select
                    name="rating"
                    defaultValue="5"
                    aria-label="التقييم"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20"
                  >
                    <option value="5">5 نجوم</option>
                    <option value="4">4 نجوم</option>
                    <option value="3">3 نجوم</option>
                    <option value="2">نجمتان</option>
                    <option value="1">نجمة واحدة</option>
                  </select>
                </div>
                <textarea
                  name="comment"
                  rows={3}
                  maxLength={1000}
                  placeholder="اكتب تعليقاً مختصراً (اختياري)"
                  className="mt-3 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20"
                />
                <button type="submit" className="mt-3 rounded-lg bg-[#2386c8] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a6da8]">
                  إرسال التقييم
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviewsGiven.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">لم ترسل أي تقييمات بعد</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">ستظهر هنا التقييمات التي ترسلها بعد إكمال العقود.</p>
          </div>
        ) : (
          reviewsGiven.map((review) => <ReviewCard key={review.id} review={review} nameLabel="قيّمت" />)
        )}
      </div>
    </section>
  );
}

export async function ReviewsReceivedSection() {
  const { reviewsReceived, averageRating, reviewsCount } = await getMyReviewsDashboard();

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#222]">التقييمات المُستلمة</h2>
          <p className="mt-1 text-[12px] text-[#666]">ما كتبه العملاء أو الأطراف الأخرى عن تجربتهم معك.</p>
        </div>
        <div className="rounded-xl border border-[#2386c8]/15 bg-[#2386c8]/5 px-4 py-3 text-center">
          <div className="text-2xl font-extrabold text-[#2386c8]" dir="ltr">
            {averageRating === null ? '—' : averageRating.toFixed(1)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{reviewsCount} تقييم</div>
        </div>
      </div>

      <div className="space-y-3">
        {reviewsReceived.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">لا توجد تقييمات مستلمة بعد</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">ستظهر هنا تقييمات العملاء بعد إكمال العقود.</p>
          </div>
        ) : (
          reviewsReceived.map((review) => <ReviewCard key={review.id} review={review} nameLabel="من" />)
        )}
      </div>
    </section>
  );
}

export async function ReviewsSection() {
  return (
    <div className="space-y-6">
      <ReviewsReceivedSection />
      <ReviewsGivenSection />
    </div>
  );
}
