/**
 * خدمات — قسم المفضلة داخل الملف الشخصي
 */

import { Link } from '@/i18n/navigation';

import { getMyWishlistItems, removeWishlistItemAction } from '@/app/actions/wishlist';
import { formatDate } from '@/lib/utils';

function EmptyWishlist() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-slate-700">لا توجد عناصر في المفضلة بعد</p>
      <p className="mt-1 text-xs leading-6 text-slate-500">احفظ المشاريع أو المستقلين الذين تريد الرجوع إليهم لاحقاً.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/projects" className="rounded-lg bg-[#2386c8] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a6da8]">
          تصفح المشاريع
        </Link>
        <Link href="/freelancers" className="rounded-lg border border-[#2386c8]/25 bg-white px-4 py-2 text-xs font-bold text-[#2386c8] transition hover:bg-[#2386c8]/10">
          تصفح المستقلين
        </Link>
      </div>
    </div>
  );
}

function RemoveButton({ itemType, itemId }: { itemType: 'project' | 'freelancer'; itemId: number }) {
  return (
    <form action={removeWishlistItemAction}>
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
      >
        إزالة
      </button>
    </form>
  );
}

export async function WishlistSection() {
  const { projects, freelancers } = await getMyWishlistItems();
  const hasItems = projects.length > 0 || freelancers.length > 0;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#222]">المفضلة</h2>
          <p className="mt-1 text-[12px] text-[#666]">مشاريع ومستقلون حفظتهم للرجوع إليهم بسرعة.</p>
        </div>
        {hasItems && <span className="text-xs font-semibold text-[#2386c8]">{projects.length + freelancers.length} عنصر</span>}
      </div>

      {!hasItems ? (
        <EmptyWishlist />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">المشاريع المحفوظة</h3>
            {projects.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">لا توجد مشاريع محفوظة.</p>
            ) : (
              projects.map((project) => (
                <article key={project.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/projects/${project.id}`} className="line-clamp-1 text-sm font-bold text-slate-900 hover:text-[#2386c8]">
                        {project.title}
                      </Link>
                      <p className="mt-1 text-[11px] text-slate-500">نُشر في {formatDate(project.createdAt)} — الحالة: {project.status}</p>
                      <p className="mt-2 text-xs font-semibold text-[#2386c8]" dir="ltr">
                        {project.budgetMin} - {project.budgetMax} USD
                      </p>
                    </div>
                    <RemoveButton itemType="project" itemId={project.id} />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">المستقلون المحفوظون</h3>
            {freelancers.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">لا يوجد مستقلون محفوظون.</p>
            ) : (
              freelancers.map((freelancer) => {
                const initial = freelancer.name.trim().charAt(0) || 'م';
                const topSkill = freelancer.skills?.split(',').map((s) => s.trim()).filter(Boolean)[0];
                return (
                  <article key={freelancer.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        {freelancer.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={freelancer.avatarUrl} alt={freelancer.name} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2386c8]/10 text-sm font-bold text-[#2386c8]">
                            {initial}
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link href={`/freelancers/${freelancer.id}`} className="line-clamp-1 text-sm font-bold text-slate-900 hover:text-[#2386c8]">
                            {freelancer.name}
                          </Link>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {freelancer.city ?? 'مدينة غير محددة'}{topSkill ? ` — ${topSkill}` : ''}
                          </p>
                          {freelancer.isKycVerified && <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">موثّق</span>}
                        </div>
                      </div>
                      <RemoveButton itemType="freelancer" itemId={freelancer.id} />
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
