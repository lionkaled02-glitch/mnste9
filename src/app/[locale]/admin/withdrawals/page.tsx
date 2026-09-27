import { getAdminWithdrawals } from '@/app/actions/admin';
import { TransactionActions } from '@/app/[locale]/admin/wallet/transaction-actions';
import { Link } from '@/i18n/navigation';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = 'force-dynamic';

const statusFilters = [
  { href: '/admin/withdrawals?status=pending', value: 'pending', label: 'قيد الانتظار' },
  { href: '/admin/withdrawals?status=completed', value: 'completed', label: 'مكتملة' },
  { href: '/admin/withdrawals?status=failed', value: 'failed', label: 'مرفوضة/فاشلة' },
  { href: '/admin/withdrawals?status=all', value: 'all', label: 'الكل' },
];

export default async function AdminWithdrawalsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const status = String(params.status ?? 'pending');
  const rows = await getAdminWithdrawals(status);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Header title="السحوبات" desc="مراجعة طلبات السحب المعلقة والمنجزة من معاملات type=withdrawal." />
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.href}
              className={
                status === filter.value
                  ? 'rounded-xl bg-[#2386c8] px-4 py-2 text-sm font-extrabold text-white'
                  : 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#2386c8] hover:text-[#2386c8]'
              }
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <DataTable columns={['المستخدم', 'المبلغ', 'طريقة الدفع', 'الحالة', 'المرجع', 'التاريخ', 'الإجراءات']} empty={rows.length === 0}>
        {rows.map((withdrawal) => (
          <tr key={withdrawal.id}>
            <td className="px-4 py-3 font-bold">{withdrawal.userName ?? `مستخدم #${withdrawal.userId}`}</td>
            <td className="px-4 py-3 font-bold">${withdrawal.amount}</td>
            <td className="px-4 py-3">{withdrawal.paymentMethod ?? '—'}</td>
            <td className="px-4 py-3"><StatusBadge status={withdrawal.status}>{withdrawal.status}</StatusBadge></td>
            <td className="px-4 py-3">{withdrawal.referenceId ?? '—'}</td>
            <td className="px-4 py-3">{withdrawal.createdAt.toLocaleDateString('ar')}</td>
            <td className="px-4 py-3">
              <TransactionActions transactionId={withdrawal.id} type="withdrawal" status={withdrawal.status} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}
