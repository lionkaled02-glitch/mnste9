'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات العقود (Server Actions) — المرحلة 9
 * ============================================================================
 *  - createContract(proposalId)  : إنشاء عقد عند قبول عرض (العميل فقط).
 *  - releasePayment(contractId)  : تحرير الدفعة للمستقل (العميل فقط).
 *  - getMyContracts()            : قائمة عقود المستخدم الحالي (عميل/مستقل).
 *
 *  مبادئ التصميم:
 *   - كل إجراء نقطة دخول غير موثوقة → تحقق zod/يدوي + جلسة + دور.
 *   - الدفاع متعدد الطبقات: middleware + getCurrentUser داخل الإجراء.
 *   - العقد يخزّن commission_rate (افتراضي 0.15) ويُستخدم في releaseFunds.
 *   - حجز الأموال يتم عبر lockFunds قبل إنشاء العقد — يضمن كفاية الرصيد.
 *   - getMyContracts دالة خادم (server) تُستدعى من صفحات لوحة التحكم،
 *     وتُرجع بيانات غنية مع أسماء الأطراف وعناوين المشاريع.
 * ============================================================================
 */

import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { contracts, projects, proposals, users, wallets } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { ESCROW_DEFAULT_COMMISSION, lockFunds, releaseFunds } from '@/lib/services/escrow.service';

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

const toNumber = (value: string | number): number =>
  typeof value === 'number' ? value : Number.parseFloat(value);

function parseId(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value) : (value as number);
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}

/* ============================================================================
 * الأنواع العامة
 * ========================================================================== */

export interface ContractListItem {
  id: number;
  projectId: number;
  projectTitle: string;
  proposalId: number;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
  amount: string;
  commissionRate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractDetails extends ContractListItem {
  projectDescription: string;
  projectStatus: string;
  escrowTransactionId: number | null;
  releaseTransactionId: number | null;
}

/* ============================================================================
 * createContract — إنشاء عقد عند قبول عرض
 * ========================================================================== */

/**
 * إنشاء عقد جديد من عرض مقبول.
 *
 * الشروط:
 *  - جلسة صالحة ودور client.
 *  - العرض موجود وحالته pending.
 *  - المشروع مملوك للعميل الحالي وحالته open.
 *  - المستقل موثّق KYC (القاعدة الذهبية).
 *  - رصيد العميل كافٍ.
 *
 * الخطوات:
 *  1. قفل محفظة العميل والتحقق من الرصيد (داخل lockFunds).
 *  2. حجز المبلغ (escrow_lock).
 *  3. إدراج العقد مع commission_rate الافتراضي.
 *  4. تحديث العرض المقبول إلى accepted وبقية العروض إلى rejected.
 *  5. تحويل المشروع إلى in_progress.
 */
export async function createContract(
  proposalId: number,
): Promise<AuthActionState & { contractId?: number }> {
  // 1) الجلسة والدور
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لإنشاء عقد',
      redirectTo: '/login',
    };
  }
  if (currentUser.role !== 'client') {
    return {
      success: false,
      message: 'إنشاء العقود متاح لأصحاب العمل فقط',
    };
  }

  const parsedId = parseId(proposalId);
  if (!parsedId) {
    return { success: false, message: 'معرّف العرض غير صالح' };
  }

  // 2) جلب العرض مع المشروع والمستقل
  const [proposal] = await db
    .select({
      id: proposals.id,
      projectId: proposals.projectId,
      freelancerId: proposals.freelancerId,
      amount: proposals.amount,
      status: proposals.status,
      projectClientId: projects.clientId,
      projectStatus: projects.status,
      projectTitle: projects.title,
      freelancerKyc: users.isKycVerified,
      freelancerName: users.name,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(users, eq(proposals.freelancerId, users.id))
    .where(eq(proposals.id, parsedId))
    .limit(1);

  if (!proposal) {
    return { success: false, message: 'العرض غير موجود' };
  }

  // 3) تحقق الملكية والحالة
  if (proposal.projectClientId !== currentUser.id) {
    return { success: false, message: 'هذا العرض ليس على أحد مشاريعك' };
  }
  if (proposal.status !== 'pending') {
    return { success: false, message: 'هذا العرض تمت معالجته مسبقاً' };
  }
  if (proposal.projectStatus !== 'open') {
    return {
      success: false,
      message: 'المشروع ليس مفتوحاً لقبول العروض',
    };
  }

  // 4) القاعدة الذهبية — المستقل يجب أن يكون موثّقاً قبل التعاقد
  if (!proposal.freelancerKyc) {
    return {
      success: false,
      message: 'المستقل غير موثّق الهوية — لا يمكن التعاقد مع مستقل غير موثّق',
    };
  }

  // 5) تحقق الرصيد (قبل الحجز — lockFunds يتحقق أيضاً داخل المعاملة)
  const [wallet] = await db
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, currentUser.id))
    .limit(1);

  const balance = toNumber(wallet?.balance ?? '0');
  const amount = toNumber(proposal.amount);
  if (balance < amount) {
    return {
      success: false,
      message: `رصيدك المتاح غير كافٍ — المتاح $${balance.toFixed(2)} والمطلوب $${amount.toFixed(2)}. اشحن محفظتك أولاً`,
      redirectTo: '/dashboard/wallet',
    };
  }

  // 6) هل يوجد عقد سابق لنفس العرض؟ (UNIQUE proposal_id)
  const [existingContract] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.proposalId, proposal.id))
    .limit(1);

  if (existingContract) {
    return {
      success: false,
      message: 'تم إنشاء عقد لهذا العرض مسبقاً',
      redirectTo: `/dashboard/contracts/${existingContract.id}`,
    };
  }

  try {
    // 7) حجز الأموال
    const { transactionId: escrowTxId } = await lockFunds(
      currentUser.id,
      proposal.projectId,
      amount,
    );

    // 8) إنشاء العقد داخل معاملة إضافية للتحديثات المتعددة
    const result = await db.transaction(async (tx) => {
      const [newContract] = await tx
        .insert(contracts)
        .values({
          projectId: proposal.projectId,
          proposalId: proposal.id,
          clientId: currentUser.id,
          freelancerId: proposal.freelancerId,
          amount: proposal.amount,
          commissionRate: ESCROW_DEFAULT_COMMISSION.toFixed(4),
          status: 'active',
          escrowTransactionId: escrowTxId,
        })
        .returning({ id: contracts.id });

      // قبول العرض الحالي
      await tx
        .update(proposals)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(proposals.id, proposal.id));

      // رفض بقية العروض المعلقة على نفس المشروع
      await tx
        .update(proposals)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(
          and(
            eq(proposals.projectId, proposal.projectId),
            eq(proposals.status, 'pending'),
          ),
        );

      // إعادة قبول العرض الحالي (لأن التحديث السابق قد يكون غيّره)
      await tx
        .update(proposals)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(proposals.id, proposal.id));

      // تحويل المشروع إلى in_progress
      await tx
        .update(projects)
        .set({ status: 'in_progress', updatedAt: new Date() })
        .where(eq(projects.id, proposal.projectId));

      return newContract;
    });

    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard/proposals');
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/wallet');
    revalidatePath(`/projects/${proposal.projectId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'تم إنشاء العقد بنجاح وحجز المبلغ في الضمان',
      redirectTo: `/dashboard/contracts/${result.id}`,
      contractId: result.id,
    };
  } catch (error) {
    // معالجة سباق UNIQUE (23505)
    if ((error as { code?: string }).code === '23505') {
      return {
        success: false,
        message: 'تم إنشاء عقد لهذا العرض مسبقاً من طلب آخر',
      };
    }
    console.error('createContract failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء إنشاء العقد — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * releasePayment — تحرير الدفعة للمستقل
 * ========================================================================== */

export async function releasePayment(
  contractId: number,
): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لتحرير الدفعة',
      redirectTo: '/login',
    };
  }

  const parsedId = parseId(contractId);
  if (!parsedId) {
    return { success: false, message: 'معرّف العقد غير صالح' };
  }

  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, parsedId))
    .limit(1);

  if (!contract) {
    return { success: false, message: 'العقد غير موجود' };
  }

  if (contract.clientId !== currentUser.id) {
    return {
      success: false,
      message: 'تحرير الدفعة متاح لصاحب المشروع فقط',
    };
  }

  if (contract.status !== 'active') {
    return {
      success: false,
      message:
        contract.status === 'completed'
          ? 'تم تحرير دفعة هذا العقد مسبقاً'
          : `لا يمكن تحرير الدفعة — حالة العقد: ${contract.status}`,
    };
  }

  try {
    const { commission, netAmount } = await releaseFunds(contract.id);

    revalidatePath('/dashboard/contracts');
    revalidatePath(`/dashboard/contracts/${contract.id}`);
    revalidatePath('/dashboard/wallet');
    revalidatePath('/dashboard/projects');
    revalidatePath(`/projects/${contract.projectId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `تم تحرير الدفعة بنجاح — العمولة $${commission.toFixed(2)} والصافي للمستقل $${netAmount.toFixed(2)}`,
      redirectTo: `/dashboard/contracts/${contract.id}`,
    };
  } catch (error) {
    console.error('releasePayment failed:', error);
    const message =
      error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تحرير الدفعة';
    return {
      success: false,
      message,
    };
  }
}

/* ============================================================================
 * getMyContracts — قائمة عقود المستخدم الحالي
 * ========================================================================== */

export async function getMyContracts(): Promise<ContractListItem[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const rows = await db
    .select({
      id: contracts.id,
      projectId: contracts.projectId,
      projectTitle: projects.title,
      proposalId: contracts.proposalId,
      clientId: contracts.clientId,
      freelancerId: contracts.freelancerId,
      amount: contracts.amount,
      commissionRate: contracts.commissionRate,
      status: contracts.status,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      clientName: users.name,
    })
    .from(contracts)
    .innerJoin(projects, eq(contracts.projectId, projects.id))
    .innerJoin(users, eq(contracts.clientId, users.id))
    .where(
      or(
        eq(contracts.clientId, currentUser.id),
        eq(contracts.freelancerId, currentUser.id),
      ),
    )
    .orderBy(desc(contracts.createdAt))
    .limit(100);

  // نحتاج أسماء المستقلين أيضاً — نجلبها باستعلام ثانٍ (أوضح من join مزدوج على users)
  const freelancerIds = [...new Set(rows.map((r) => r.freelancerId))];
  const clientIds = [...new Set(rows.map((r) => r.clientId))];
  const allUserIds = [...new Set([...freelancerIds, ...clientIds])];

  const usersMap = new Map<number, string>();
  if (allUserIds.length > 0) {
    const userRows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, allUserIds));
    for (const u of userRows) usersMap.set(u.id, u.name);
  }

  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    proposalId: row.proposalId,
    clientId: row.clientId,
    clientName: usersMap.get(row.clientId) ?? row.clientName,
    freelancerId: row.freelancerId,
    freelancerName: usersMap.get(row.freelancerId) ?? 'مستقل',
    amount: row.amount,
    commissionRate: row.commissionRate,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/* ============================================================================
 * getContractById — تفاصيل عقد واحد (للصفحة التفصيلية)
 * ========================================================================== */

export async function getContractById(
  contractId: number,
): Promise<ContractDetails | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const parsedId = parseId(contractId);
  if (!parsedId) return null;

  const [row] = await db
    .select({
      id: contracts.id,
      projectId: contracts.projectId,
      projectTitle: projects.title,
      projectDescription: projects.description,
      projectStatus: projects.status,
      proposalId: contracts.proposalId,
      clientId: contracts.clientId,
      freelancerId: contracts.freelancerId,
      amount: contracts.amount,
      commissionRate: contracts.commissionRate,
      status: contracts.status,
      escrowTransactionId: contracts.escrowTransactionId,
      releaseTransactionId: contracts.releaseTransactionId,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
    })
    .from(contracts)
    .innerJoin(projects, eq(contracts.projectId, projects.id))
    .where(
      and(
        eq(contracts.id, parsedId),
        or(
          eq(contracts.clientId, currentUser.id),
          eq(contracts.freelancerId, currentUser.id),
        ),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [clientUser, freelancerUser] = await Promise.all([
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.clientId))
      .limit(1),
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.freelancerId))
      .limit(1),
  ]);

  return {
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    projectDescription: row.projectDescription,
    projectStatus: row.projectStatus,
    proposalId: row.proposalId,
    clientId: row.clientId,
    clientName: clientUser[0]?.name ?? 'عميل',
    freelancerId: row.freelancerId,
    freelancerName: freelancerUser[0]?.name ?? 'مستقل',
    amount: row.amount,
    commissionRate: row.commissionRate,
    status: row.status,
    escrowTransactionId: row.escrowTransactionId,
    releaseTransactionId: row.releaseTransactionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/* ============================================================================
 * أغلفة useActionState — للنماذج التي تعمل بلا JS
 * ========================================================================== */

export async function createContractAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = formData.get('proposalId');
  const proposalId = typeof raw === 'string' ? Number(raw) : Number.NaN;
  return createContract(proposalId);
}

export async function releasePaymentAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = formData.get('contractId');
  const contractId = typeof raw === 'string' ? Number(raw) : Number.NaN;
  return releasePayment(contractId);
}
