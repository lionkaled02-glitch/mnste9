import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/utils';

interface PendingViewProps {
  documentType: string;
  createdAt: Date;
}

export function PendingView({ documentType, createdAt }: PendingViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-3xl text-white">◷</div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">طلب التوثيق قيد المراجعة</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">استلمنا وثائقك ويراجعها فريق التوثيق. يمكنك متابعة استخدام لوحة التحكم، وستظهر النتيجة فور اعتماد الطلب أو رفضه.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900">تفاصيل الطلب</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100">
          <div className="flex justify-between p-4 text-sm"><span className="text-slate-500">نوع الوثيقة</span><span className="font-bold text-slate-900">{documentType}</span></div>
          <div className="flex justify-between p-4 text-sm"><span className="text-slate-500">تاريخ الرفع</span><span className="font-bold text-slate-900">{formatDate(createdAt)}</span></div>
          <div className="flex justify-between p-4 text-sm"><span className="text-slate-500">الحالة</span><span className="font-bold text-amber-600">قيد المراجعة</span></div>
        </div>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">العودة للوحة التحكم</Link>
      </section>
    </div>
  );
}
