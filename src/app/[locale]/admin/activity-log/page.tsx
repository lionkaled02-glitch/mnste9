import { Link } from '@/i18n/navigation';

import { getAuditLogs } from '@/app/actions/admin';

import { AuditLogInteractiveList } from './audit-log-details-modal';

export const dynamic = 'force-dynamic';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminActivityLogPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const page = Math.max(Number(params.page ?? 1), 1);
  const result = await getAuditLogs({ page, limit: 50 });
  return (
    <div className="space-y-6">
      <Header title="سجل الأنشطة" desc="آخر الأحداث المهمة في المنصة مع تفاصيل تفاعلية وتصدير CSV." />
      <AuditLogInteractiveList logs={result.data} />
      <Pagination currentPage={result.page} totalPages={result.totalPages} />
    </div>
  );
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return <div className="flex items-center justify-center gap-2"><Link href={`/admin/activity-log?page=${Math.max(currentPage - 1, 1)}`} className="rounded-xl border px-4 py-2 text-sm font-bold">السابق</Link><span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600">{currentPage} / {totalPages}</span><Link href={`/admin/activity-log?page=${Math.min(currentPage + 1, totalPages)}`} className="rounded-xl border px-4 py-2 text-sm font-bold">التالي</Link></div>;
}

function Header({ title, desc }: { title: string; desc: string }) { return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>; }
