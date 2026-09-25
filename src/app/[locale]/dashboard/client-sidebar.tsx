'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const CLIENT_NAV_ITEMS = [
  { href: '/dashboard', label: 'نظرة عامة' },
  { href: '/dashboard/projects', label: 'المشاريع' },
  { href: '/dashboard/proposals', label: 'العروض' },
  { href: '/dashboard/contracts', label: 'العقود' },
  { href: '/dashboard/wallet', label: 'المحفظة' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/profile', label: 'الملف الشخصي' },
  { href: '/dashboard/wishlist', label: 'المفضلة' },
  { href: '/dashboard/reviews', label: 'التقييمات' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
] as const;

function SimpleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15" />
    </svg>
  );
}

export function ClientSidebar() {
  const pathname = usePathname();
  const isActive = (href: string): boolean =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-l">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4 lg:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2386c8] text-white">خ</span>
        <div>
          <p className="text-sm font-bold text-slate-900">لوحة صاحب العمل</p>
          <p className="text-xs text-slate-400">خدمات</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-x-visible" aria-label="تنقل لوحة صاحب العمل">
        {CLIENT_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition',
              isActive(item.href) ? 'bg-[#2386c8]/10 font-semibold text-[#2386c8]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <SimpleIcon />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
