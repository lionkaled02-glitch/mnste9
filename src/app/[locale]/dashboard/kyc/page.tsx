import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { getKycStatus } from '@/lib/services/kyc';
import { KYC_DOCUMENT_TYPE_LABELS } from '@/lib/services/kyc-meta';

import { ApprovedRedirect } from './approved-redirect';
import { KycUploadForm } from './kyc-form';
import { PendingView } from './pending-view';

export const metadata: Metadata = {
  title: 'توثيق الهوية | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function KycPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const { isVerified, latestDocument } = await getKycStatus(currentUser.id);

  if (currentUser.isKycVerified || isVerified) {
    return <ApprovedRedirect />;
  }

  if (latestDocument?.status === 'pending') {
    return (
      <PendingView
        documentType={KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] || latestDocument.documentType}
        createdAt={latestDocument.createdAt}
      />
    );
  }

  const rejectedReason = latestDocument?.status === 'rejected' ? latestDocument.rejectionReason : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950">توثيق الهوية</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">اختر نوع الوثيقة ثم ارفع الصور من الكاميرا أو من المعرض. السيلفي يستخدم الكاميرا الأمامية، وصور الوثائق تستخدم الكاميرا الخلفية عند الالتقاط.</p>
      </div>

      {rejectedReason && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">
          <h2 className="font-extrabold text-red-800">تم رفض طلب التوثيق السابق</h2>
          <p className="mt-2">سبب الرفض: {rejectedReason}</p>
          <p className="mt-1">يرجى إعادة رفع صور أوضح ومطابقة للبيانات.</p>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <KycUploadForm />
      </section>
    </div>
  );
}
