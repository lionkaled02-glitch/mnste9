import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getLatestKycDocument, getPendingReviewInfo } from '@/app/actions/kyc-status';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

import { getFreelancerSetupState, getFreelancerSetupValues } from '../setup/setup-data';
import { isFreelancerSetupComplete } from '../setup/setup-helpers';
import { PendingReviewActions } from './pending-actions';

export const metadata: Metadata = {
  title: 'طلبك قيد المراجعة | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function PendingReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?from=/dashboard/pending-review');
  if (user.role !== 'freelancer') redirect('/dashboard');

  const [setupState, setupValues, latestKyc] = await Promise.all([
    getFreelancerSetupState(user.id),
    getFreelancerSetupValues(user.id),
    getLatestKycDocument(user.id),
  ]);

  if (!setupValues || !isFreelancerSetupComplete(setupState)) redirect('/dashboard/setup');
  if (!latestKyc) redirect('/dashboard/setup');
  if (latestKyc.status === 'rejected') redirect('/dashboard/kyc?rejected=1');
  if (latestKyc.status !== 'pending' || setupValues.isKycVerified) redirect('/dashboard');

  const info = await getPendingReviewInfo(user.id);
  if (!info) redirect('/dashboard');

  const checklist = [
    'تم استلام رقم الجوال',
    'تم استلام النبذة التعريفية',
    'تم استلام المهارات',
    'تم استلام وثائق الهوية',
    'تم استلام معرض الأعمال',
  ];

  return (
    <div className="mx-auto max-w-3xl py-8">
      <section className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-5xl">⏳</div>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">شكراً لك! طلبك قيد المراجعة</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
          تم إرسال بياناتك بنجاح. فريق الدعم سيراجعها خلال 24 ساعة.
        </p>

        <div className="mt-8 grid gap-4 text-right sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold text-slate-500">الرقم المرجعي</p>
            <p className="mt-2 text-lg font-extrabold text-[#2386c8]" dir="ltr">{info.referenceNumber}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold text-slate-500">وقت الإرسال</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(info.submittedAt)} — {info.submittedAt.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right">
          <h2 className="text-sm font-extrabold text-slate-900">قائمة التحقق</h2>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-semibold text-emerald-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          لا يمكنك تقديم عروض حتى الموافقة على حسابك.
        </p>

        <PendingReviewActions />
      </section>
    </div>
  );
}
