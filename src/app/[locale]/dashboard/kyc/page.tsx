/**
 * ============================================================================
 *  mnste9 — توثيق الهوية KYC (/dashboard/kyc) — المرحلة 8
 * ============================================================================
 *  القاعدة الذهبية (موثّقة):
 *   KYC إلزامي للمستقلين فقط (قبل أي عمل: عرض/دفعة/سحب) — أصحاب العمل
 *   والأدوار الأخرى لا يحتاجونه إطلاقاً، لذا توجَّههم الصفحة فوراً إلى
 *   /dashboard مع رسالة «KYC للمستقلين فقط» (عبر معامل ?notice=).
 *
 *  المحتوى (للمستقل):
 *   - بطاقة الحالة: غير موثق | قيد المراجعة (pending) | موثّق | مرفوض
 *     (مع سبب الرفض من reviewed_reason — هجرة 00003).
 *   - نموذج رفع 3 ملفات (أمامي/خلفي/سيلفي) — يعمل بلا JavaScript، وكل
 *     ملف يُشفَّر AES-256-GCM ويُخزَّن خارج قاعدة البيانات.
 *   - إذا كانت معتمدة: معلومات الوثيقة (النوع، تاريخ الرفع، تاريخ
 *     المراجعة) دون نموذج رفع جديد.
 *
 *  قرار موثّق — طلب واحد نشط: يُخفى النموذج عند وجود طلب قيد المراجعة
 *  أو حساب معتمد، ويعود متاحاً بعد الرفض لإعادة التقديم.
 *
 *  الحماية: middleware + فحص إضافي عبر getCurrentUser + بوابة الدور هنا
 *  (الإجراء نفسه يفحص الدور أيضاً — دفاع متعدد الطبقات).
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
import { cn, formatDate } from '@/lib/utils';

import { KycUploadForm } from './kyc-form';

export const metadata: Metadata = {
  title: 'توثيق الهوية',
};

/** نص شارة «لم تُرفع وثائق بعد» في بطاقة الحالة */
const NO_DOCUMENT_LABEL = 'لم تُرفع وثائق';

export default async function KycPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى صفحة التوثيق.
        </p>
        <Link
          href="/login?from=/dashboard/kyc"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  // القاعدة الذهبية: التوثيق للمستقلين فقط — غيرهم يوجَّه إلى لوحة التحكم
  // مع رسالة «KYC للمستقلين فقط» (تعرضها صفحة نظرة عامة من ?notice=)
  if (currentUser.role !== 'freelancer') {
    redirect('/dashboard?notice=kyc-freelancers-only');
  }

  const { isVerified, latestDocument } = await getKycStatus(currentUser.id);

  /** هل نموذج الرفع متاح؟ (لا طلب نشط والحساب غير موثّق) */
  const canUpload =
    !isVerified && (!latestDocument || latestDocument.status !== 'pending');

  /** نص وشكل بطاقة الحالة الرئيسية */
  const statusCard = isVerified
    ? {
        title: 'هوية موثّقة (KYC) ✓',
        description:
          'حسابك موثّق — يمكنك تقديم العروض واستلام الدفعات والسحب.',
        badge: 'معتمدة',
        badgeClasses: 'bg-emerald-100 text-emerald-800',
        iconClasses: 'bg-emerald-50 text-emerald-600',
      }
    : latestDocument?.status === 'pending'
      ? {
          title: 'طلبك قيد المراجعة',
          description:
            'استلمنا وثائقك الثلاث ويراجعها فريق التوثيق — ستظهر النتيجة هنا وعبر إشعاراتك.',
          badge: KYC_STATUS_LABELS.pending,
          badgeClasses: KYC_STATUS_BADGE_CLASSES.pending,
          iconClasses: 'bg-amber-50 text-amber-600',
        }
      : latestDocument?.status === 'rejected'
        ? {
            title: 'وثائقك السابقة مرفوضة',
            description: latestDocument.rejectionReason
              ? `سبب الرفض: ${latestDocument.rejectionReason} — ارفع وثائق أصح وأوضح.`
              : 'لم تُعتمد الوثائق السابقة (وضوح غير كافٍ أو بيانات غير مطابقة مثلاً) — ارفع وثائق أصح.',
            badge: KYC_STATUS_LABELS.rejected,
            badgeClasses: KYC_STATUS_BADGE_CLASSES.rejected,
            iconClasses: 'bg-red-50 text-red-600',
          }
        : {
            title: 'الهوية غير موثّقة بعد',
            description:
              'توثيق الهوية مطلوب قبل تقديم أي عرض أو استلام دفعة أو سحب — وهو يعزز ثقة أصحاب العمل بك.',
            badge: NO_DOCUMENT_LABEL,
            badgeClasses: 'bg-slate-100 text-slate-600',
            iconClasses: 'bg-slate-100 text-slate-400',
          };

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          توثيق الهوية
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ارفع صور وثيقتك — الوجه الأمامي والخلفي وسيلفي معها — وتُراجَع من
          فريق التوثيق خلال أيام العمل
        </p>
      </div>

      {/* بطاقة الحالة الحالية */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                statusCard.iconClasses,
              )}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {statusCard.title}
              </h2>
              <p className="mt-1.5 text-sm leading-7 text-slate-500">
                {statusCard.description}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
              statusCard.badgeClasses,
            )}
          >
            {statusCard.badge}
          </span>
        </div>
      </section>

      {/* معلومات الوثيقة — عند الاعتماد (مواصفة المرحلة) */}
      {isVerified && latestDocument && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">معلومات الوثيقة</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">نوع الوثيقة</dt>
              <dd className="text-sm font-semibold text-slate-800">
                {KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] ??
                  latestDocument.documentType}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">تاريخ الرفع</dt>
              <dd className="text-sm font-semibold text-slate-800">
                {formatDate(latestDocument.createdAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">تاريخ المراجعة</dt>
              <dd className="text-sm font-semibold text-slate-800">
                {latestDocument.reviewedAt
                  ? formatDate(latestDocument.reviewedAt)
                  : formatDate(latestDocument.updatedAt)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-6 text-slate-400">
            تُحفظ ملفات الوثائق الثلاثة مشفّرة (AES-256-GCM) خارج قاعدة
            البيانات ولا تُعرض لأي طرف — حتى صاحب المشروع أو المستقل لا يرى
            وثائقك.
          </p>
        </section>
      )}

      {/* نموذج الرفع — متاح فقط دون طلب نشط وبتوثيق غير معتمد */}
      {canUpload ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">رفع وثائق الهوية</h2>
          <p className="mt-1 text-sm text-slate-500">
            بطاقة الهوية أو جواز السفر أو رخصة القيادة — ثلاث صور واضحة:
            الوجه الأمامي، الوجه الخلفي، وسيلفي وأنت تحمل الوثيقة.
          </p>
          <div className="mt-6 max-w-xl">
            <KycUploadForm />
          </div>
        </section>
      ) : (
        !isVerified &&
        latestDocument?.status === 'pending' && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              تفاصيل الطلب الحالي
            </h2>
            <dl className="mt-2 divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">نوع الوثيقة</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {KYC_DOCUMENT_TYPE_LABELS[latestDocument.documentType] ??
                    latestDocument.documentType}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">تاريخ الرفع</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {formatDate(latestDocument.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">الوثائق المرفقة</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  الوجه الأمامي · الوجه الخلفي · السيلفي
                </dd>
              </div>
            </dl>
          </section>
        )
      )}
    </div>
  );
}
