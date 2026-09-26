'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥', children: ['All Users', 'Clients', 'Freelancers', 'Admins'] },
  { href: '/admin/kyc', label: 'KYC', icon: '🆔', badge: '!', children: ['Pending', 'Approved', 'Rejected'] },
  { href: '/admin/projects', label: 'Projects', icon: '📋' },
  { href: '/admin/proposals', label: 'Proposals', icon: '🎯' },
  { href: '/admin/contracts', label: 'Contracts', icon: '📝', badge: '!', children: ['Active', 'Disputed'] },
  { href: '/admin/wallet', label: 'Wallet', icon: '💰' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '💸', badge: '!' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/notifications', label: 'Notifications', icon: '📢' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/activity-log', label: 'Activity Log', icon: '📜' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(ar|en)/, '') || '/admin';
  const isActive = (href: string) => (href === '/admin' ? normalizedPath === '/admin' : normalizedPath === href || normalizedPath.startsWith(`${href}/`));

  return (
    <aside className="w-full shrink-0 bg-[#1a1a2e] text-white shadow-2xl lg:min-h-[calc(100vh-4rem)] lg:w-72">
      <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4" aria-label="Admin navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'group flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:min-w-0',
              isActive(item.href) ? 'bg-white text-[#1a1a2e] shadow-lg' : 'text-slate-200 hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {'badge' in item && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold', isActive(item.href) ? 'bg-red-100 text-red-700' : 'bg-red-500 text-white')}>{item.badge}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
