/**
 * ============================================================================
 *  خدمات — توثيق الهوية KYC (/dashboard/kyc) — إعادة تصميم 100% مستقل
 * ============================================================================
 *  - حالة التوثيق: Not Verified / Pending Review / Verified ✅
 *  - نموذج رفع: الوجه الأمامي + سيلفي مع رسائل أمان
 *  - للمستقلين فقط — غيرهم يوجّه إلى /dashboard
 *  - Tailwind RTL + #2386c8
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import {
  KYC_DOCUMENT_TYPE_LABELS,
  KYC_STATUS_BADGE_CLASSES,
  KYC_STATUS_LABELS,
} from '@/lib/services/kyc-meta';
import { getKycStatus } from '@/lib/services/kyc';
import { formatDate } from '@/lib/utils';

import { KycUploadForm } from './kyc-form';

export const metadata: Metadata = {
  title: 'توثيق الهوية | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function KycPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-[15px] font-bold text-[#222]">انتهت جلستك</p>
        <p className="mt-2 text-[13px] text-[#666]">سجّل دخولك للوصول إلى توثيق الهوية</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (currentUser.role !== 'freelancer') {
    redirect('/dashboard?notice=kyc-freelancers-only');
  }

  const { isVerified, latestDocument } = await getKycStatus(currentUser.id);

  const canUpload = !isVerified && (!latestDocument || latestDocument.status !== 'pending');

  const statusKey = isVerified ? 'verified' : latestDocument?.status || 'not_verified';

  const statusConfig: Record<string, { label: string; title: string; desc: string; color: string; icon: string; badge: string }> = {
    verified: {
      label: 'Verified ✅',
      title: 'هوية موثقة',
      desc: 'حسابك موثّق — يمكنك تقديم العروض واستلام الدفعات وسحب الأرباح بثقة أعلى.',
      color: 'border-emerald-200 bg-emerald-50',
      icon: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-600 text-white',
    },
    pending: {
      label: 'Pending Review',
      title: 'قيد المراجعة',
      desc: 'استلمنا وثائقك ويراجعها فريق التوثيق خلال 24-48 ساعة. ستصلك النتيجة هنا وعبر الإشعارات.',
      color: 'border-amber-200 bg-amber-50',
      icon: 'bg-amber-500 text-white',
      badge: 'bg-amber-500 text-white',
    },
    rejected: {
      label: 'Rejected',
      title: 'مرفوضة — إعادة مطلوبة',
      desc: latestDocument?.rejectionReason ? `سبب الرفض: ${latestDocument.rejectionReason} — ارفع صوراً أوضح ومطابقة.` : 'لم تُعتمد الوثائق (وضوح غير كافٍ أو بيانات غير مطابقة). ارفع وثائق أصح.',
      color: 'border-red-200 bg-red-50',
      icon: 'bg-red-500 text-white',
      badge: 'bg-red-500 text-white',
    },
    not_verified: {
      label: 'Not Verified',
      title: 'غير موثق',
      desc: 'توثيق الهوية مطلوب للمستقلين قبل تقديم أي عرض أو استلام دفعة أو سحب — يزيد ثقة العملاء بك.',
      color: 'border-gray-200 bg-white',
      icon: 'bg-[#f4f5f7] text-[#999] border border-gray-200',
      badge: 'bg-gray-200 text-[#666]',
    },
  };

  const current = statusConfig[statusKey] || statusConfig.not_verified;

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-[22px] font-extrabold text-[#222]">توثيق الهوية</h1>
        <p className="mt-1 text-[13px] text-[#666]">أمان حسابك وثقة العملاء — صورة الهوية + سيلفي فقط</p>
      </div>

      {/* Status card */}
      <section className={`rounded-[14px] border p-6 shadow-sm ${current.color}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[18px] font-bold ${current.icon}`}>
              {statusKey === 'verified' ? '✓' : statusKey === 'pending' ? '◷' : statusKey === 'rejected' ? '✕' : '◌'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-extrabold text-[#222]">{current.title}</h2>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${current.badge}`}>{current.label}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-6 text-[#444] max-w-[520px]">{current.desc}</p>

              {latestDocument && (
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white border border-gray-200 px-3 py-1 font-medium text-[#666]">النوع: {KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] || latestDocument.documentType}</span>
                  <span className="rounded-full bg-white border border-gray-200 px-3 py-1 font-medium text-[#666]">الرفع: {formatDate(latestDocument.createdAt)}</span>
                  {latestDocument.reviewedAt && <span className="rounded-full bg-white border border-gray-200 px-3 py-1 font-medium text-[#666]">المراجعة: {formatDate(latestDocument.reviewedAt)}</span>}
                  {latestDocument.status && <span className={`rounded-full border px-3 py-1 font-bold ${KYC_STATUS_BADGE_CLASSES[latestDocument.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{KYC_STATUS_LABELS[latestDocument.status]}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {isVerified && (
          <div className="mt-6 rounded-[10px] bg-white border border-emerald-200 p-4">
            <div className="flex gap-2.5">
              <span className="text-emerald-600 mt-0.5">🔒</span>
              <p className="text-[11px] leading-6 text-[#555]">وثائقك محفوظة مشفرة AES-256-GCM خارج قاعدة البيانات — لا يراها أحد سوى فريق التوثيق، ولا تُشارك مع العملاء أو أي طرف ثالث.</p>
            </div>
          </div>
        )}
      </section>

      {/* Info cards */}
      {!isVerified && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[12px] border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2386c8]/10 text-[#2386c8] text-[14px] font-bold">1</div>
            <h3 className="mt-3 text-[12px] font-bold text-[#222]">الوجه الأمامي</h3>
            <p className="mt-1 text-[11px] leading-5 text-[#888]">بطاقة أو جواز واضح — جميع الزوايا ظاهرة</p>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2386c8]/10 text-[#2386c8] text-[14px] font-bold">2</div>
            <h3 className="mt-3 text-[12px] font-bold text-[#222]">سيلفي مع الوثيقة</h3>
            <p className="mt-1 text-[11px] leading-5 text-[#888]">صورة وجهك وأنت تحمل الهوية — إثبات الحيوية</p>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600 text-[14px]">🔒</div>
            <h3 className="mt-3 text-[12px] font-bold text-[#222]">أمان وثقة</h3>
            <p className="mt-1 text-[11px] leading-5 text-[#888]">تشفير كامل • مراجعة يدوية • حذف تلقائي بعد التحقق</p>
          </div>
        </div>
      )}

      {/* Upload */}
      {canUpload ? (
        <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-[15px] font-bold text-[#222]">رفع مستندات الهوية</h2>
          <p className="mt-1 text-[12px] leading-6 text-[#666]">اختر نوع الوثيقة وارفع صورتين واضحتين. الصيغ المدعومة JPG/PNG/WEBP حتى 8MB — تأكد أن الإضاءة جيدة والنص مقروء.</p>

          <div className="mt-3 rounded-[10px] bg-[#2386c8]/[0.06] border border-[#2386c8]/15 p-3 flex gap-2">
            <span className="text-[#2386c8] mt-0.5 text-[13px]">🛡️</span>
            <p className="text-[11px] leading-5 text-[#444]"><b className="text-[#222]">رسائل الأمان:</b> لا نشارك وثائقك مع أي طرف. تُستخدم للتحقق فقط، وتُخزن مشفرة خارج DB، وتُحذف نسخ المعاينة بعد الاعتماد. يمنع انتحال الهوية ويحمي مجتمع خدمات.</p>
          </div>

          <div className="mt-6 max-w-[560px]">
            <KycUploadForm />
          </div>

          <div className="mt-6 grid gap-2 text-[11px] leading-5 text-[#888]">
            <p>• يجب أن تطابق بيانات الوثيقة اسمك في الملف الشخصي.</p>
            <p>• السيلفي: وجه واضح، الوثيقة بجانب الوجه، بدون نظارة شمسية أو فلتر.</p>
            <p>• المراجعة خلال 24-48 ساعة — في حال الرفض يمكنك إعادة الرفع فوراً.</p>
          </div>
        </section>
      ) : !isVerified && latestDocument?.status === 'pending' ? (
        <section className="rounded-[14px] border border-amber-200 bg-white p-6 shadow-sm">
          <h2 className="text-[14px] font-bold text-[#222]">تفاصيل الطلب الحالي</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-[10px] border border-gray-100">
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">نوع الوثيقة</span><span className="font-bold text-[#222]">{KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] || latestDocument.documentType}</span></div>
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">تاريخ الرفع</span><span className="font-bold text-[#222]">{formatDate(latestDocument.createdAt)}</span></div>
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">المرفقات</span><span className="font-bold text-[#222]">أمامي + خلفي + سيلفي</span></div>
          </div>
          <p className="mt-4 text-[11px] leading-6 text-[#888]">لا يمكنك رفع طلب جديد أثناء المراجعة. ستصلك النتيجة قريباً — إذا تأخر أكثر من 48 ساعة تواصل مع الدعم.</p>
        </section>
      ) : null}

      {isVerified && latestDocument && (
        <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-[14px] font-bold text-[#222]">معلومات التوثيق</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-[10px] border border-gray-100">
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">نوع الوثيقة</span><span className="font-bold text-[#222]">{KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] || latestDocument.documentType}</span></div>
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">تاريخ الرفع</span><span className="font-bold text-[#222]">{formatDate(latestDocument.createdAt)}</span></div>
            <div className="flex justify-between p-3 text-[12px]"><span className="text-[#888]">تاريخ الاعتماد</span><span className="font-bold text-[#222]">{latestDocument.reviewedAt ? formatDate(latestDocument.reviewedAt) : formatDate(latestDocument.updatedAt)}</span></div>
          </div>
        </section>
      )}
    </div>
  );
}
