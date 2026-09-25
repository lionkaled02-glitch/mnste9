'use client';

import { useState, useTransition } from 'react';

import { removeWishlistItemAction, type WishlistDashboardItems } from '@/app/actions/wishlist';
import { Link } from '@/i18n/navigation';

interface WishlistTabsProps {
  data: WishlistDashboardItems;
}

export function WishlistTabs({ data }: WishlistTabsProps) {
  const [tab, setTab] = useState<'freelancers' | 'projects'>('freelancers');
  const [projects, setProjects] = useState(data.projects);
  const [freelancers, setFreelancers] = useState(data.freelancers);
  const [isPending, startTransition] = useTransition();

  const remove = (itemType: 'project' | 'freelancer', itemId: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('itemType', itemType);
      formData.set('itemId', String(itemId));
      await removeWishlistItemAction(formData);
      if (itemType === 'project') setProjects((prev) => prev.filter((item) => item.id !== itemId));
      else setFreelancers((prev) => prev.filter((item) => item.id !== itemId));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">المفضلة</h1>
          <p className="mt-1 text-sm text-slate-500">كل المشاريع والمستقلين الذين حفظتهم في مكان واحد.</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-1">
          <button type="button" onClick={() => setTab('freelancers')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'freelancers' ? 'bg-white text-[#2386c8] shadow-sm' : 'text-slate-600'}`}>المستقلون</button>
          <button type="button" onClick={() => setTab('projects')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'projects' ? 'bg-white text-[#2386c8] shadow-sm' : 'text-slate-600'}`}>المشاريع</button>
        </div>
      </div>

      {tab === 'freelancers' && (freelancers.length === 0 ? <Empty title="لا يوجد مستقلون في المفضلة" /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {freelancers.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-lg font-extrabold text-[#2386c8]">{item.name?.slice(0, 1) ?? 'م'}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-extrabold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.city ?? 'غير محدد'}</p>
                  {item.skills && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{item.skills}</p>}
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Link href={`/freelancers/${item.id}`} className="flex-1 rounded-xl bg-[#2386c8]/10 px-4 py-2.5 text-center text-sm font-bold text-[#2386c8]">عرض الملف</Link>
                <button type="button" disabled={isPending} onClick={() => remove('freelancer', item.id)} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-60">إزالة</button>
              </div>
            </article>
          ))}
        </div>
      ))}

      {tab === 'projects' && (projects.length === 0 ? <Empty title="لا توجد مشاريع في المفضلة" /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="line-clamp-1 text-lg font-extrabold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-500">الحالة: {item.status}</p>
              <p className="mt-2 text-sm font-bold text-[#2386c8]">{item.budgetMin ?? 0} - {item.budgetMax ?? 0}</p>
              <div className="mt-5 flex gap-2">
                <Link href={`/projects/${item.id}`} className="flex-1 rounded-xl bg-[#2386c8]/10 px-4 py-2.5 text-center text-sm font-bold text-[#2386c8]">عرض المشروع</Link>
                <button type="button" disabled={isPending} onClick={() => remove('project', item.id)} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-60">إزالة</button>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2386c8]/10 text-3xl">♡</div>
      <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">اضغط على زر المفضلة في المشاريع أو ملفات المستقلين لإضافتها هنا.</p>
    </div>
  );
}
