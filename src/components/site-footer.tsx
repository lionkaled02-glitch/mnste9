/**
 * ============================================================================
 *  mnste9 — التذييل (Footer) — المرحلة 1 i18n + المرحلة 10
 * ============================================================================
 *  4 أعمدة: عن المنصة | روابط سريعة | للمستقلين | تواصل معنا
 *  + وسائل الدفع: Visa، Mastercard، PayPal، بنك الكريمي
 *  يدعم العربية والإنجليزية عبر next-intl
 * ============================================================================
 */

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('Footer');

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
            <p className="mt-4 text-sm leading-7 text-slate-500">{t('aboutText')}</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {t('madeInYemen')}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('quickLinks')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/projects" className="hover:text-emerald-700 hover:underline">
                  {t('browseProjects')}
                </Link>
              </li>
              <li>
                <Link href="/freelancers" className="hover:text-emerald-700 hover:underline">
                  {t('freelancers')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-700 hover:underline">
                  {t('aboutUs')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-emerald-700 hover:underline">
                  {t('helpCenter')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('forFreelancers')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/register" className="hover:text-emerald-700 hover:underline">
                  {t('createFreelancer')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/kyc" className="hover:text-emerald-700 hover:underline">
                  {t('kyc')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/wallet" className="hover:text-emerald-700 hover:underline">
                  {t('wallet')}
                </Link>
              </li>
              <li>
                <Link href="/help#freelancers" className="hover:text-emerald-700 hover:underline">
                  {t('tips')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('contact')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>support@mnste9.com</li>
              <li>+967 77X XXX XXX</li>
              <li>عدن، اليمن / Aden, Yemen</li>
            </ul>
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-700">{t('paymentMethods')}</h4>
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
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">{t('rights')}</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/help" className="hover:text-slate-600 hover:underline">
              {t('privacy')}
            </Link>
            <Link href="/help" className="hover:text-slate-600 hover:underline">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
