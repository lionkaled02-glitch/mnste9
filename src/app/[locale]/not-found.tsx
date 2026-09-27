import { Link } from '@/i18n/navigation';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4" dir="rtl">
      <div className="text-center">
        <div className="mb-6 text-8xl font-extrabold text-[#2386c8]">404</div>
        <h1 className="text-3xl font-bold text-slate-800">الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm text-slate-500">الرابط الذي تبحث عنه غير صحيح أو تم حذفه.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">
            العودة للرئيسية
          </Link>
          <Link href="/projects" className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
            تصفح المشاريع
          </Link>
        </div>
      </div>
    </main>
  );
}
