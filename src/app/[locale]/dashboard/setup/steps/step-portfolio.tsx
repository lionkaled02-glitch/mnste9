'use client';

import { useState } from 'react';

import { PortfolioWorkCard, type LocalPortfolioWork } from './portfolio-work-card';
import { PortfolioWorkForm } from './portfolio-work-form';

interface StepPortfolioProps {
  initialCount: number;
  onComplete: () => void;
}

export function StepPortfolio({ initialCount, onComplete }: StepPortfolioProps) {
  const [portfolioCount, setPortfolioCount] = useState(initialCount);
  const [localWorks, setLocalWorks] = useState<LocalPortfolioWork[]>([]);
  const remaining = Math.max(0, 3 - portfolioCount);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2386c8]/15 bg-[#2386c8]/5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">معرض الأعمال المحسّن</h3>
            <p className="mt-1 text-sm text-slate-600">الحد الأدنى 3 أعمال، وكل عمل يحتاج 3 صور على الأقل. الصورة الأولى تصبح صورة الغلاف تلقائياً.</p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#2386c8] ring-1 ring-[#2386c8]/15">
            {Math.min(portfolioCount, 3)} من 3 أعمال مكتملة
          </span>
        </div>
        {remaining > 0 ? (
          <p className="mt-3 text-xs font-semibold text-amber-700">أضف {remaining} عمل/أعمال إضافية لإنهاء الإعداد.</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-emerald-700">تم استيفاء الحد الأدنى من الأعمال.</p>
            <button type="button" onClick={onComplete} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              إنهاء الإعداد وإرسال الطلب للمراجعة
            </button>
          </div>
        )}
      </div>

      {portfolioCount < 3 && (
        <PortfolioWorkForm
          onCreated={(work, newCount) => {
            setLocalWorks((prev) => [work, ...prev]);
            setPortfolioCount(newCount);
          }}
        />
      )}

      {localWorks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localWorks.map((work) => <PortfolioWorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}
