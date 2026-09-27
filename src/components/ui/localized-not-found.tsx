import { Link } from '@/i18n/navigation';

const COPY = {
  ar: {
    title: 'الصفحة غير موجودة',
    description: 'الرابط الذي تبحث عنه غير صحيح أو تم حذفه.',
    home: 'العودة للرئيسية',
    projects: 'تصفح المشاريع',
  },
  en: {
    title: 'Page not found',
    description: 'The link you are looking for is invalid or has been removed.',
    home: 'Back to home',
    projects: 'Browse projects',
  },
} as const;

export function LocalizedNotFound({ locale = 'ar' }: { locale?: string }) {
  const copy = locale === 'en' ? COPY.en : COPY.ar;
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4" dir={dir}>
      <div className="text-center">
        <div className="mb-6 text-8xl font-extrabold text-[#2386c8]">404</div>
        <h1 className="text-3xl font-bold text-slate-800">{copy.title}</h1>
        <p className="mt-3 text-sm text-slate-500">{copy.description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">
            {copy.home}
          </Link>
          <Link href="/projects" className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
            {copy.projects}
          </Link>
        </div>
      </div>
    </main>
  );
}
