import { notFound } from 'next/navigation';

import { approveKycAction, getAdminKycDetails, getAdminKycImagePreviews, rejectKycAction } from '@/app/actions/admin';
import { StatusBadge } from '@/components/admin/status-badge';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export default async function AdminKycDetailsPage({ params }: Props) {
  const { id } = await params;
  const row = await getAdminKycDetails(id);
  if (!row) notFound();

  const images = await getAdminKycImagePreviews({
    frontFilePath: row.frontFilePath,
    backFilePath: row.backFilePath,
    selfieFilePath: row.selfieFilePath,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#1a1a2e] p-6 text-white">
        <h1 className="text-3xl font-extrabold">طلب KYC #{row.id}</h1>
        <p className="mt-2 text-slate-300">{row.userName} — {row.userEmail}</p>
        <div className="mt-4"><StatusBadge status={row.status}>{row.status}</StatusBadge></div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Info label="نوع الوثيقة" value={row.documentType} />
        <Info label="الاسم الكامل" value={row.fullName} />
        <Info label="رقم الوثيقة" value={row.documentNumber} />
        <Info label="تاريخ الإصدار" value={row.issueDate} />
        <Info label="تاريخ الانتهاء" value={row.expiryDate} />
        <Info label="مكان الإصدار" value={row.issuePlace} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#1a1a2e]">صور الوثائق</h2>
            <p className="mt-1 text-sm text-slate-500">تُفك الصور المشفرة من التخزين وتُعرض هنا للمشرف فقط.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {images.map((image) => (
            <article key={image.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <h3 className="text-sm font-extrabold text-slate-900">{image.label}</h3>
              </div>
              {image.dataUrl ? (
                <a href={image.dataUrl} target="_blank" rel="noreferrer" className="block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.dataUrl} alt={image.label} className="h-56 w-full object-cover transition group-hover:scale-[1.02]" />
                  <div className="bg-white px-4 py-2 text-center text-xs font-bold text-[#2386c8]">اضغط للتكبير</div>
                </a>
              ) : (
                <div className="flex h-56 items-center justify-center p-4 text-center text-sm leading-6 text-slate-500">
                  {image.error ?? 'لا يمكن عرض هذه الصورة'}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-extrabold text-[#1a1a2e]">الإجراءات</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={approveKycAction}>
            <input type="hidden" name="id" value={row.id} />
            <button className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">✅ موافقة</button>
          </form>
          <form action={rejectKycAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={row.id} />
            <input name="reason" placeholder="سبب الرفض" className="rounded-xl border px-4 py-2 text-sm" />
            <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white">❌ رفض</button>
          </form>
          <form action={rejectKycAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="reason" value="يرجى إعادة رفع الوثائق بصور أوضح" />
            <button className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800">📝 طلب إعادة الرفع</button>
          </form>
        </div>
        {row.rejectionReason && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">سبب الرفض السابق: {row.rejectionReason}</p>}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 font-extrabold text-[#1a1a2e]">{value ? String(value) : '—'}</p>
    </div>
  );
}
