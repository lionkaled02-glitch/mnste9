'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
          <div className="text-center">
            <div className="mb-6 text-7xl">😔</div>
            <h1 className="text-3xl font-bold text-slate-800">حدث خطأ غير متوقع</h1>
            <p className="mt-3 text-sm text-slate-500">نعتذر عن الإزعاج. جرب إعادة تحميل الصفحة.</p>
            <button onClick={reset} className="mt-6 rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a6da8]">
              حاول مجدداً
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
