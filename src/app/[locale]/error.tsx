'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4" dir="rtl">
      <div className="text-center">
        <div className="mb-6 text-7xl">😔</div>
        <h1 className="text-3xl font-bold text-slate-800">حدث خطأ غير متوقع</h1>
        <p className="mt-3 text-sm text-slate-500">نعتذر عن الإزعاج. جرب إعادة تحميل الصفحة.</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">
          حاول مجدداً
        </button>
      </div>
    </main>
  );
}
