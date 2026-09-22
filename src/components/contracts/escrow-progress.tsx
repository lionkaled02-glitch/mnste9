/**
 * شريط مسار الضمان المالي (Escrow Progress Bar)
 * [1. حجز المبلغ] -> [2. تنفيذ العمل] -> [3. تسليم العمل] -> [4. تحرير المبلغ]
 */

interface Props {
  status: string;
  escrowLockedAt?: Date | null;
  releasedAt?: Date | null;
}

const STEPS = [
  { key: 'locked', label: 'حجز المبلغ في الضمان', desc: 'تم حجز المبلغ من العميل' },
  { key: 'execution', label: 'تنفيذ العمل', desc: 'المستقل يعمل على المشروع' },
  { key: 'delivery', label: 'تسليم العمل', desc: 'تم التسليم بانتظار المراجعة' },
  { key: 'released', label: 'تحرير المبلغ', desc: 'تم تحويل المستحقات' },
];

function getCurrentStepIndex(status: string): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'active':
      return 1;
    case 'pending_delivery':
      return 2;
    case 'completed':
      return 3;
    case 'disputed':
      return 1; // نزاع يظهر بعد التنفيذ
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
}

export function EscrowProgress({ status }: Props) {
  const current = getCurrentStepIndex(status);
  const isDisputed = status === 'disputed';
  const isCancelled = status === 'cancelled';

  return (
    <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#222]">مسار الضمان المالي</h3>
        {isDisputed && <span className="rounded-full bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1 text-[10px] font-bold">متنازع عليه</span>}
        {isCancelled && <span className="rounded-full bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 text-[10px] font-bold">ملغى</span>}
      </div>

      <div className="mt-6 relative">
        {/* خط خلفي */}
        <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-gray-200 hidden sm:block" />
        <div
          className="absolute top-[18px] right-[18px] h-[2px] bg-[#2386c8] transition-all hidden sm:block"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />

        <div className="grid gap-4 sm:grid-cols-4">
          {STEPS.map((step, idx) => {
            const isDone = idx < current;
            const isCurrent = idx === current;
            const isUpcoming = idx > current;

            return (
              <div key={step.key} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold transition
                    ${isDone ? 'bg-[#2386c8] border-[#2386c8] text-white' : ''}
                    ${isCurrent ? 'bg-white border-[#2386c8] text-[#2386c8] shadow-[0_0_0_4px_rgba(35,134,200,0.15)]' : ''}
                    ${isUpcoming ? 'bg-white border-gray-300 text-gray-400' : ''}
                    ${isDisputed && isCurrent ? 'border-orange-400 text-orange-600' : ''}
                  `}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-[12px] font-bold ${isCurrent ? 'text-[#222]' : isDone ? 'text-[#2386c8]' : 'text-[#888]'}`}>{step.label}</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#999]">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-[10px] bg-[#f4f5f7] border border-gray-100 p-3 text-[11px] leading-5 text-[#666]">
        💡 المبلغ يبقى في ضمان خدمات حتى موافقتك — في حال عدم الالتزام نضمن استرداد حقك المالي.
      </div>
    </div>
  );
}
