/**
 * ============================================================================
 *  خدمات — Site Footer
 * ============================================================================
 *  5 أعمدة منظمة بدون تكرار روابط:
 *  خدمات | روابط سريعة | عن الشركة | قانوني | تواصل
 * ============================================================================
 */

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const linkClass = 'text-[13px] text-[#666] transition hover:text-[#2386c8]';

export async function SiteFooter() {
  const t = await getTranslations('Footer');

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2386c8] text-[17px] font-extrabold text-white shadow-sm">خ</span>
              <span className="text-[21px] font-extrabold text-[#222]">خدمات</span>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-[#666]">{t('aboutText')}</p>

            <div className="mt-6">
              <h4 className="text-[12px] font-bold text-[#222]">{t('social')}</h4>
              <div className="mt-3 flex gap-2">
                <a href="#" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-[#f4f5f7] text-[#666] transition hover:bg-[#1877f2] hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-2.9h2v-2.2c0-2 1.2-3.1 3-3.1.9 0 1.8.1 2 .2v2.2h-1.1c-.9 0-1.2.5-1.2 1.2v1.7h2.4l-.4 2.9h-2V22A10 10 0 0 0 22 12Z" /></svg>
                </a>
                <a href="#" aria-label="Twitter" className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-[#f4f5f7] text-[#666] transition hover:bg-[#1da1f2] hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 5.8a8.4 8.4 0 0 1-2.4.7A4.2 4.2 0 0 0 21.5 4a8.4 8.4 0 0 1-2.7 1A4.2 4.2 0 0 0 12 8.8a12 12 0 0 1-8.7-4.4A4.2 4.2 0 0 0 5 8.1a4.2 4.2 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.5 8.5 0 0 1 2 16.3a12 12 0 0 0 6.5 1.9A12 12 0 0 0 21 6.5v-.5A8.6 8.6 0 0 0 22 5.8Z" /></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-[#f4f5f7] text-[#666] transition hover:bg-[#0a66c2] hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5v-9h3v9ZM6.5 8.5A1.75 1.75 0 1 1 8.3 6.7a1.75 1.75 0 0 1-1.8 1.8ZM19 19h-3v-4.5c0-1.1-.4-1.8-1.3-1.8a1.4 1.4 0 0 0-1.3.9 1.7 1.7 0 0 0-.1.6V19h-3s0-8.2 0-9h3v1.3a3 3 0 0 1 2.7-1.5c2 0 3.5 1.3 3.5 4V19Z" /></svg>
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-[#222]">{t('quickLinks')}</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/projects" className={linkClass}>{t('browseProjects')}</Link></li>
              <li><Link href="/freelancers" className={linkClass}>{t('freelancers')}</Link></li>
              <li><Link href="/projects/new" className={linkClass}>{t('addProject')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-[#222]">{t('company')}</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/about" className={linkClass}>{t('aboutUs')}</Link></li>
              <li><Link href="/faq" className={linkClass}>{t('faq')}</Link></li>
              <li><Link href="/contact" className={linkClass}>{t('contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-[#222]">{t('legal')}</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/terms" className={linkClass}>{t('terms')}</Link></li>
              <li><Link href="/privacy" className={linkClass}>{t('privacy')}</Link></li>
              <li><Link href="/help/guarantee" className={linkClass}>{t('guarantee')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-[#222]">{t('contactColumn')}</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[#666]">
              <li>support@khadamat.com</li>
              <li dir="ltr" className="text-right">+967 77X XXX XXX</li>
              <li>عدن، اليمن — Aden, Yemen</li>
            </ul>

            <div className="mt-6">
              <h4 className="text-[11px] font-bold text-[#222]">{t('paymentMethods')}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#999]">Visa</span>
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#999]">Mastercard</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#003087]" />PayPal</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#00a651]" />بنك الكريمي</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 md:flex-row">
          <p className="text-[12px] text-[#888]">{t('rights')}</p>
          <div className="flex items-center gap-3 text-[11px] text-[#999]">
            <span>{t('madeInYemen')}</span>
            <span className="h-3 w-px bg-gray-200" />
            <span>خدمات © 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
