'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ArticleFeedback() {
  const t = useTranslations('help.feedback');
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  if (voted) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center">
        <p className="text-lg font-bold text-emerald-800">{voted === 'yes' ? t('thanksYes') : t('thanksNo')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
      <p className="mb-4 text-lg font-bold text-[#222]">{t('question')}</p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setVoted('yes')}
          className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
        >
          {t('yes')}
        </button>
        <button
          type="button"
          onClick={() => setVoted('no')}
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
        >
          {t('no')}
        </button>
      </div>
    </div>
  );
}
