/**
 * ============================================================================
 *  mnste9 — التذييل (Footer) — المرحلة 10 نهائي
 * ============================================================================
 *  4 أعمدة: عن المنصة | روابط سريعة | للمستقلين | تواصل معنا
 *  + وسائل الدفع: Visa، Mastercard، PayPal، بنك الكريمي
 *  تصميم بسيط ومتجاوب RTL — Tailwind فقط
 * ============================================================================
 */

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7 12 3 4 7v10l8 4 8-4V7Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 21V11" />
                </svg>
              </span>
              <span className="text-base font-bold text-slate-900">mnste9</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              منصة العمل الحر العربية — تجمع أصحاب الأعمال والمستقلين في بيئة آمنة بضمان مالي (Escrow) وتوثيق هوية
              إلزامي (KYC).
            </p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                صنع في اليمن 🇾🇪
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">روابط سريعة</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/projects" className="hover:text-emerald-700 hover:underline">
                  تصفح المشاريع
                </Link>
              </li>
              <li>
                <Link href="/freelancers" className="hover:text-emerald-700 hover:underline">
                  المستقلون
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-700 hover:underline">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-emerald-700 hover:underline">
                  مركز المساعدة
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">للمستقلين</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/register" className="hover:text-emerald-700 hover:underline">
                  إنشاء حساب مستقل
                </Link>
              </li>
              <li>
                <Link href="/dashboard/kyc" className="hover:text-emerald-700 hover:underline">
                  توثيق الهوية (KYC)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/wallet" className="hover:text-emerald-700 hover:underline">
                  المحفظة والمدفوعات
                </Link>
              </li>
              <li>
                <Link href="/help#freelancers" className="hover:text-emerald-700 hover:underline">
                  نصائح للمستقلين
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">تواصل معنا</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>البريد: support@mnste9.com</li>
              <li>الهاتف: +967 77X XXX XXX</li>
              <li>عدن، اليمن</li>
            </ul>
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-700">وسائل الدفع</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Visa
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Mastercard
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  PayPal
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  بنك الكريمي
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">بنك الكريمي يدعم USD و SAR فقط — لا يدعم YER.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">جميع الحقوق محفوظة © ٢٠٢٦ mnste9 — منصة العمل الحر العربية</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/help" className="hover:text-slate-600 hover:underline">
              الخصوصية
            </Link>
            <Link href="/help" className="hover:text-slate-600 hover:underline">
              الشروط
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
