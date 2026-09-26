import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

export const metadata: Metadata = {
  title: 'لوحة الإدارة | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <AdminHeader user={user} />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
