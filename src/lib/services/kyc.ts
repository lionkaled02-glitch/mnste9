/**
 * ============================================================================
 *  mnste9 — استعلامات توثيق الهوية KYC (طبقة خدمات — للخادم فقط)
 * ============================================================================
 *  الدوال المصدَّرة:
 *   - getKycStatus(userId) : الحالة الحالية + آخر وثيقة (إن وُجدت).
 *
 *  قرار موثّق — عرض آخر وثيقة فقط:
 *   جدول kyc_documents يسمح بعدة وثائق للمستخدم، والصفحة تعرض آخرها
 *   (الأحدث createdAt). الحالة المعروضة في البطاقة الرئيسية تأتي من
 *   users.is_kyc_verified (نتيجة اعتماد الإدارة)، بينما حالة الطلب
 *   التفصيلية (قيد المراجعة/مرفوضة) من آخر وثيقة.
 * ============================================================================
 */

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { kycDocuments, users } from '@/db/schema';

/** آخر وثيقة KYC للمستخدم (أو null إن لم يرفع شيئاً بعد) */
export interface KycDocumentInfo {
  id: number;
  documentType: string;
  status: string;
  /** سبب الرفض إن رُفض الطلب (هجرة 00003) */
  rejectionReason: string | null;
  /** تاريخ مراجعة فريق التوثيق (هجرة 00003) */
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** حالة التوثيق الكاملة للمستخدم */
export interface KycStatus {
  /** نتيجة الاعتماد النهائية من users.is_kyc_verified */
  isVerified: boolean;
  /** آخر وثيقة مرفوعة (null = لم يرفع شيئاً بعد) */
  latestDocument: KycDocumentInfo | null;
}

/** الحالة الحالية لتوثيق مستخدم مع آخر وثيقة له */
export async function getKycStatus(userId: number): Promise<KycStatus> {
  const [account] = await db
    .select({ isKycVerified: users.isKycVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [latestDocument] = await db
    .select({
      id: kycDocuments.id,
      documentType: kycDocuments.documentType,
      status: kycDocuments.status,
      rejectionReason: kycDocuments.rejectionReason,
      reviewedAt: kycDocuments.reviewedAt,
      createdAt: kycDocuments.createdAt,
      updatedAt: kycDocuments.updatedAt,
    })
    .from(kycDocuments)
    .where(eq(kycDocuments.userId, userId))
    .orderBy(desc(kycDocuments.createdAt))
    .limit(1);

  return {
    isVerified: account?.isKycVerified ?? false,
    latestDocument: latestDocument ?? null,
  };
}
