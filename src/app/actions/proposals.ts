'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات العروض: قبول العرض (المرحلة 9)
 * ============================================================================
 *  - acceptProposal(proposalId): يتحقق من الصلاحيات ثم يستدعي
 *    createContract(proposalId) من إجراءات العقود.
 *
 *  القاعدة الذهبية: لا يوجد ملف actions/proposals.ts سابقاً — هذا الملف
 *  هو الواجهة المطلوبة في مواصفة المرحلة 9، وsubmitProposal يبقى في
 *  actions/projects.ts (المرحلة 7).
 *
 *  التصميم:
 *   - دفاع متعدد الطبقات: جلسة + دور + ملكية المشروع.
 *   - يستدعي createContract مباشرة — كل منطق الحجز والتحقق هناك
 *     لتجنب التكرار.
 * ============================================================================
 */

import type { AuthActionState } from '@/lib/auth';

import { createContract } from './contracts';

/**
 * قبول عرض — ينشئ عقداً ويحجز المبلغ.
 *
 * @param proposalId معرّف العرض
 * @returns نتيجة العملية مع redirectTo إلى صفحة العقد عند النجاح
 */
export async function acceptProposal(
  proposalId: number,
): Promise<AuthActionState & { contractId?: number }> {
  return createContract(proposalId);
}

/**
 * غلاف useActionState — (prevState, FormData) للنماذج التي تعمل بلا JS.
 */
export async function acceptProposalAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = formData.get('proposalId');
  const proposalId = typeof raw === 'string' ? Number(raw) : Number.NaN;
  return acceptProposal(proposalId);
}
