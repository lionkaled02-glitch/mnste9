'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const BASE_FREELANCER_NAV_ITEMS = [
  { href: '/dashboard', label: 'نظرة عامة' },
  { href: '/dashboard/projects', label: 'المشاريع' },
  { href: '/dashboard/proposals', label: 'العروض' },
  { href: '/dashboard/contracts', label: 'العقود' },
  { href: '/dashboard/wallet', label: 'المحفظة' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/profile', label: 'الملف الشخصي' },
  { href: '/dashboard/profile/portfolio', label: 'معرض أعمالي', icon: 'portfolio' },
  { href: '/dashboard/wishlist', label: 'المفضلة' },
  { href: '/dashboard/reviews', label: 'التقييمات' },
  { href: '/dashboard/kyc', label: 'توثيق الهوية' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
] as const;

function SimpleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
    </svg>
  );
}

export function FreelancerSidebar({ setupComplete = true, isKycVerified = false }: { setupComplete?: boolean; isKycVerified?: boolean }) {
  const pathname = usePathname();
  const filteredItems = BASE_FREELANCER_NAV_ITEMS.filter((item) => !(isKycVerified && item.href === '/dashboard/kyc'));
  const navItems = setupComplete
    ? filteredItems
    : ([
        { href: '/dashboard/setup', label: 'إعداد الحساب' },
        ...filteredItems,
      ] as const);

  const isActive = (href: string): boolean => {
    if (href === '/dashboard' || href === '/dashboard/profile') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-l">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4 lg:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2386c8] text-white">خ</span>
        <div>
          <p className="text-sm font-bold text-slate-900">لوحة المستقل</p>
          <p className="text-xs text-slate-400">خدمات</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-x-visible" aria-label="تنقل لوحة المستقل">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition',
              isActive(item.href) ? 'bg-[#2386c8]/10 font-semibold text-[#2386c8]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {'icon' in item && item.icon === 'portfolio' ? <PortfolioIcon /> : <SimpleIcon />}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
