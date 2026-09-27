import { getAdminWallet } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { ExportButton } from '@/components/admin/export-modal';
import { StatusBadge } from '@/components/admin/status-badge';

import { TransactionActions } from './transaction-actions';

export const dynamic = 'force-dynamic';

type WalletSearchParams = Promise<{
  type?: string;
  status?: string;
  q?: string;
}>;

const transactionTypes = [
  { value: '', label: 'كل الأنواع' },
  { value: 'deposit', label: 'إيداع' },
  { value: 'withdrawal', label: 'سحب' },
  { value: 'escrow_hold', label: 'حجز ضمان' },
  { value: 'escrow_release', label: 'تحرير ضمان' },
  { value: 'commission', label: 'عمولة' },
];

const transactionStatuses = [
  { value: '', label: 'كل الحالات' },
  { value: 'pending', label: 'معلّق' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'failed', label: 'مرفوض/فاشل' },
  { value: 'refunded', label: 'مسترد' },
];

const typeLabels: Record<string, string> = {
  deposit: 'إيداع',
  withdrawal: 'سحب',
  escrow_lock: 'حجز ضمان',
  escrow_hold: 'حجز ضمان',
  escrow_release: 'تحرير ضمان',
  commission: 'عمولة',
};

export default async function AdminWalletPage({ searchParams }: { searchParams: WalletSearchParams }) {
  const params = await searchParams;
  const type = params.type ?? '';
  const status = params.status ?? '';
  const q = params.q ?? '';
  const data = await getAdminWallet({ type, status, q });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Header title="المحفظة" desc="أرصدة المحافظ وكل الحركات المالية مع فلاتر وإجراءات اعتماد الطلبات." />
        <ExportButton
          title="المحفظة"
          data={data.wallets.map((wallet) => ({
            user: wallet.userName ?? '—',
            balance: wallet.balance,
            pendingBalance: wallet.pendingBalance,
            updatedAt: wallet.updatedAt.toLocaleDateString('ar'),
          }))}
          columns={[
            { key: 'user', label: 'المستخدم' },
            { key: 'balance', label: 'الرصيد' },
            { key: 'pendingBalance', label: 'المعلق' },
            { key: 'updatedAt', label: 'آخر تحديث' },
          ]}
        />
      </div>

      <DataTable columns={['المستخدم', 'الرصيد', 'المعلق', 'آخر تحديث']} empty={data.wallets.length === 0}>
        {data.wallets.map((wallet) => (
          <tr key={wallet.id}>
            <td className="px-4 py-3 font-bold">{wallet.userName ?? `مستخدم #${wallet.userId}`}</td>
            <td className="px-4 py-3">${wallet.balance}</td>
            <td className="px-4 py-3">${wallet.pendingBalance}</td>
            <td className="px-4 py-3">{wallet.updatedAt.toLocaleDateString('ar')}</td>
          </tr>
        ))}
      </DataTable>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Header title="كل المعاملات" desc="اعتمد أو ارفض الإيداعات والسحوبات المعلقة من نفس الجدول." />
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_240px_auto]">
            <label className="space-y-1 text-sm font-bold text-slate-700">
              <span>النوع</span>
              <select name="type" defaultValue={type} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20">
                {transactionTypes.map((option) => (
                  <option key={option.value || 'all-types'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-bold text-slate-700">
              <span>الحالة</span>
              <select name="status" defaultValue={status} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20">
                {transactionStatuses.map((option) => (
                  <option key={option.value || 'all-statuses'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-bold text-slate-700">
              <span>بحث</span>
              <input name="q" defaultValue={q} placeholder="اسم أو بريد المستخدم" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20" />
            </label>
            <button type="submit" className="rounded-xl bg-[#2386c8] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#1f78b4]">
              تطبيق الفلاتر
            </button>
          </form>
        </div>
      </div>

      <DataTable columns={['#', 'المستخدم', 'النوع', 'المبلغ', 'طريقة الدفع', 'الحالة', 'التاريخ', 'الإجراءات']} empty={data.transactions.length === 0}>
        {data.transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td className="px-4 py-3 font-bold text-slate-500">#{transaction.id}</td>
            <td className="px-4 py-3">
              <div className="font-bold text-[#1a1a2e]">{transaction.userName ?? `مستخدم #${transaction.userId}`}</div>
              {transaction.userEmail ? <div className="text-xs text-slate-500">{transaction.userEmail}</div> : null}
            </td>
            <td className="px-4 py-3">{typeLabels[transaction.type] ?? transaction.type}</td>
            <td className="px-4 py-3 font-bold">${transaction.amount}</td>
            <td className="px-4 py-3">{transaction.paymentMethod ?? '—'}</td>
            <td className="px-4 py-3"><StatusBadge status={transaction.status}>{transaction.status}</StatusBadge></td>
            <td className="px-4 py-3">{transaction.createdAt.toLocaleDateString('ar')}</td>
            <td className="px-4 py-3">
              <TransactionActions transactionId={transaction.id} type={transaction.type} status={transaction.status} />
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
