/**
 * ============================================================================
 *  خدمات — التذييل (Footer) — المرحلة أ
 * ============================================================================
 *  - 4 أعمدة: عن المنصة | روابط سريعة | للمستقلين | تواصل معنا
 *  - وسائل الدفع: PayPal، بنك الكريمي
 *  - سطر الحقوق في الأسفل
 *  - تصميم بسيط وهادئ مستوحى من مستقل — Tailwind فقط — RTL
 * ============================================================================
 */

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('Footer');

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* عن المنصة */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-[18px] font-extrabold text-white">
                خ
              </span>
              <span className="text-xl font-extrabold text-gray-900">خدمات</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-gray-500">{t('aboutText')}</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-[#f4f5f7] px-3 py-1 text-xs font-medium text-gray-600">
                {t('madeInYemen')}
              </span>
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('quickLinks')}</h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/projects" className="transition hover:text-emerald-600">
                  تصفح المشاريع
                </Link>
              </li>
              <li>
                <Link href="/freelancers" className="transition hover:text-emerald-600">
                  المستقلين
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-emerald-600">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition hover:text-emerald-600">
                  مركز المساعدة
                </Link>
              </li>
            </ul>
          </div>

          {/* للمستقلين */}
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('forFreelancers')}</h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/register" className="transition hover:text-emerald-600">
                  إنشاء حساب
                </Link>
              </li>
              <li>
                <Link href="/dashboard/kyc" className="transition hover:text-emerald-600">
                  توثيق الهوية
                </Link>
              </li>
              <li>
                <Link href="/dashboard/wallet" className="transition hover:text-emerald-600">
                  المحفظة
                </Link>
              </li>
              <li>
                <Link href="/help#freelancers" className="transition hover:text-emerald-600">
                  نصائح للمستقلين
                </Link>
              </li>
            </ul>
          </div>

          {/* تواصل معنا */}
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('contact')}</h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                support@khadamat.com
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.977-.852-1.102l-3.107-1.036a1.5 1.5 0 0 0-1.5.221l-1.732 1.155a24.058 24.058 0 0 1-3.882-2.117 24.058 24.058 0 0 1-2.117-3.882l1.155-1.732a1.5 1.5 0 0 0 .221-1.5L6.475 4.902A1.125 1.125 0 0 0 5.373 4.05H4a2.25 2.25 0 0 0-2.25 2.25V9" />
                </svg>
                +967 77X XXX XXX
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                عدن، اليمن
              </li>
            </ul>

            <div className="mt-8">
              <h4 className="text-xs font-bold text-gray-900">{t('paymentMethods')}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#f4f5f7] px-3 py-1.5 text-xs font-semibold text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  PayPal
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#f4f5f7] px-3 py-1.5 text-xs font-semibold text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  بنك الكريمي
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#f4f5f7] px-3 py-1.5 text-xs font-semibold text-gray-400">
                  Visa
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#f4f5f7] px-3 py-1.5 text-xs font-semibold text-gray-400">
                  Mastercard
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">بنك الكريمي يدعم USD و SAR فقط.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">{t('rights')}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/help" className="hover:text-gray-600">
              {t('privacy')}
            </Link>
            <Link href="/help" className="hover:text-gray-600">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
