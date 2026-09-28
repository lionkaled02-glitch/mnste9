'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات العقود (Server Actions) — المرحلة 9 (مواصفة دقيقة)
 * ============================================================================
 *  - createContract(proposalId)  : إنشاء عقد عند قبول عرض (العميل فقط).
 *  - releasePayment(contractId)  : تحرير الدفعة للمستقل (العميل فقط).
 *  - getMyContracts()            : قائمة عقود المستخدم الحالي.
 *
 *  المواصفة الدقيقة:
 *   CREATE TABLE contracts (
 *     id BIGINT PRIMARY KEY,
 *     project_id BIGINT NOT NULL,
 *     client_id BIGINT NOT NULL,
 *     freelancer_id BIGINT NOT NULL,
 *     proposal_id BIGINT (NULL, SET NULL),
 *     amount NUMERIC(15,2) NOT NULL,
 *     commission_rate NUMERIC(5,4) DEFAULT 0.15,
 *     commission NUMERIC(15,2) NOT NULL,
 *     net_amount NUMERIC(15,2) NOT NULL,
 *     status VARCHAR(20) DEFAULT 'pending',
 *     escrow_locked_at TIMESTAMPTZ,
 *     released_at TIMESTAMPTZ,
 *     created_at, updated_at
 *   );
 *   - commission = amount * commission_rate
 *   - net_amount = amount - commission
 *   - escrow.service يستخدم commission_rate من العقد نفسه
 * ============================================================================
 */

import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { conversations as conversationsTable, contracts, messages as messagesTable, projects, proposals, users, wallets } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import {
  ESCROW_DEFAULT_COMMISSION,
  lockFunds,
  releaseFunds,
} from '@/lib/services/escrow.service';
import { sendEscrowReleasedEmail, sendProposalAcceptedEmail } from '@/lib/services/email';
import { createNotification } from '@/lib/services/notifications';
import { uploadToImageKit, type UploadResult } from '@/lib/services/imagekit';

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

const toNumber = (value: string | number): number =>
  typeof value === 'number' ? value : Number.parseFloat(value);

const toNumeric = (value: number): string => value.toFixed(2);

function parseId(value: unknown): number | null {
  const num =
    typeof value === 'string'
      ? Number(value)
      : typeof value === 'number'
        ? value
        : Number.NaN;
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}


function isFileLike(value: FormDataEntryValue): value is File {
  return typeof File !== 'undefined' && value instanceof File && value.size > 0;
}

function formatDeliveryFiles(files: UploadResult[]): string {
  if (files.length === 0) return '';
  const lines = files.map(
    (file, index) => `${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)\n${file.url}`,
  );
  return `\n📎 ملفات مرفقة:\n${lines.join('\n')}`;
}

function parseDeliveryFilesFromContent(content: string): DeliveryFile[] {
  if (!content.includes('📎 ملفات مرفقة:')) return [];
  const [, filesPart] = content.split('📎 ملفات مرفقة:');
  if (!filesPart) return [];

  const lines = filesPart
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const files: DeliveryFile[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];
    if (!current || !next || !/^https?:\/\//i.test(next)) continue;
    const name = current.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*\)$/, '').trim() || `ملف ${files.length + 1}`;
    files.push({ name, url: next });
    index += 1;
  }

  return files;
}

async function getDeliveryFilesForContract(input: { projectId: number; clientId: number; freelancerId: number }): Promise<DeliveryFile[]> {
  const rows = await db
    .select({ content: messagesTable.content })
    .from(messagesTable)
    .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(
      and(
        eq(conversationsTable.projectId, input.projectId),
        eq(messagesTable.senderId, input.freelancerId),
        or(
          and(eq(conversationsTable.participant1Id, input.clientId), eq(conversationsTable.participant2Id, input.freelancerId)),
          and(eq(conversationsTable.participant1Id, input.freelancerId), eq(conversationsTable.participant2Id, input.clientId)),
        ),
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(25);

  return rows.flatMap((row) => parseDeliveryFilesFromContent(row.content));
}

/* ============================================================================
 * الأنواع العامة
 * ========================================================================== */

export interface ContractListItem {
  id: number;
  projectId: number;
  projectTitle: string;
  proposalId: number | null;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
  amount: string;
  commissionRate: string;
  commission: string;
  netAmount: string;
  status: string;
  escrowLockedAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryFile {
  name: string;
  url: string;
}

export interface ContractDetails extends ContractListItem {
  projectDescription: string;
  projectStatus: string;
  deliveryFiles: DeliveryFile[];
}

/* ============================================================================
 * createContract — إنشاء عقد عند قبول عرض
 * ========================================================================== */

export async function createContract(
  proposalId: number,
): Promise<AuthActionState & { contractId?: number }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لإنشاء عقد',
      redirectTo: '/login',
    };
  }
  // Unified Role: أي مستخدم يمكنه إنشاء عقد عبر قبول عرض على مشروعه
  const parsedId = parseId(proposalId);
  if (!parsedId) {
    return { success: false, message: 'معرّف العرض غير صالح' };
  }

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
      freelancerEmail: users.email,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(users, eq(proposals.freelancerId, users.id))
    .where(eq(proposals.id, parsedId))
    .limit(1);

  if (!proposal) {
    return { success: false, message: 'العرض غير موجود' };
  }

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

  if (!proposal.freelancerKyc) {
    return {
      success: false,
      message: 'المستقل غير موثّق الهوية — لا يمكن التعاقد مع مستقل غير موثّق',
    };
  }

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

  // حساب العمولة والصافي من commission_rate الافتراضي
  const commissionRate = ESCROW_DEFAULT_COMMISSION;
  const commission = +(amount * commissionRate).toFixed(2);
  const netAmount = +(amount - commission).toFixed(2);

  if (netAmount <= 0) {
    return {
      success: false,
      message: 'صافي المبلغ بعد العمولة يجب أن يكون أكبر من صفر',
    };
  }

  try {
    await lockFunds(currentUser.id, proposal.projectId, amount);

    const rejectedProposalOwners = await db
      .select({ freelancerId: proposals.freelancerId })
      .from(proposals)
      .where(and(eq(proposals.projectId, proposal.projectId), eq(proposals.status, 'pending')));

    const result = await db.transaction(async (tx) => {
      const [newContract] = await tx
        .insert(contracts)
        .values({
          projectId: proposal.projectId,
          clientId: currentUser.id,
          freelancerId: proposal.freelancerId,
          proposalId: proposal.id,
          amount: toNumeric(amount),
          commissionRate: commissionRate.toFixed(4),
          commission: toNumeric(commission),
          netAmount: toNumeric(netAmount),
          status: 'active',
          escrowLockedAt: new Date(),
        })
        .returning({ id: contracts.id });

      await tx
        .update(proposals)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(proposals.id, proposal.id));

      await tx
        .update(proposals)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(
          and(
            eq(proposals.projectId, proposal.projectId),
            eq(proposals.status, 'pending'),
          ),
        );

      await tx
        .update(proposals)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(proposals.id, proposal.id));

      await tx
        .update(projects)
        .set({ status: 'in_progress', updatedAt: new Date() })
        .where(eq(projects.id, proposal.projectId));

      return newContract;
    });

    await createNotification({
      userId: proposal.freelancerId,
      title: 'تم قبول عرضك 🎉',
      message: `تم قبول عرضك على مشروع "${proposal.projectTitle}" وإنشاء العقد.`,
      type: 'success',
      link: `/dashboard/contracts/${result.id}`,
    });
    await createNotification({
      userId: currentUser.id,
      title: 'تم إنشاء العقد',
      message: `تم إنشاء عقد مشروع "${proposal.projectTitle}" وحجز مبلغ الضمان.`,
      type: 'success',
      link: `/dashboard/contracts/${result.id}`,
    });
    await Promise.all(
      rejectedProposalOwners
        .filter((owner) => owner.freelancerId !== proposal.freelancerId)
        .map((owner) =>
          createNotification({
            userId: owner.freelancerId,
            title: 'لم يتم اختيار عرضك',
            message: `تم اختيار عرض آخر لمشروع "${proposal.projectTitle}".`,
            type: 'warning',
            link: '/dashboard/proposals',
          }),
        ),
    );
    await sendProposalAcceptedEmail(proposal.freelancerEmail, proposal.freelancerName, proposal.projectTitle);

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
 * releasePayment — تحرير الدفعة
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

  // Unified: السماح بالتحرير من active أو pending_delivery
  if (contract.status !== 'active' && (contract.status as string) !== 'pending_delivery') {
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

    const [[freelancer], [project]] = await Promise.all([
      db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, contract.freelancerId)).limit(1),
      db.select({ title: projects.title }).from(projects).where(eq(projects.id, contract.projectId)).limit(1),
    ]);
    await createNotification({
      userId: contract.freelancerId,
      title: 'تم تحرير دفعة الضمان ✅',
      message: `تم تحرير $${netAmount.toFixed(2)} إلى محفظتك.`,
      type: 'success',
      link: '/dashboard/wallet',
    });
    if (freelancer) await sendEscrowReleasedEmail(freelancer.email, freelancer.name, netAmount.toFixed(2), project?.title ?? 'مشروع');

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
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع أثناء تحرير الدفعة';
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
      commission: contracts.commission,
      netAmount: contracts.netAmount,
      status: contracts.status,
      escrowLockedAt: contracts.escrowLockedAt,
      releasedAt: contracts.releasedAt,
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

  const allUserIds = [
    ...new Set([...rows.map((r) => r.freelancerId), ...rows.map((r) => r.clientId)]),
  ];

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
    commission: row.commission,
    netAmount: row.netAmount,
    status: row.status,
    escrowLockedAt: row.escrowLockedAt,
    releasedAt: row.releasedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/* ============================================================================
 * getContractById — تفاصيل عقد واحد
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
      commission: contracts.commission,
      netAmount: contracts.netAmount,
      status: contracts.status,
      escrowLockedAt: contracts.escrowLockedAt,
      releasedAt: contracts.releasedAt,
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

  const deliveryFiles = row.status === 'pending_delivery' || row.status === 'completed'
    ? await getDeliveryFilesForContract({ projectId: row.projectId, clientId: row.clientId, freelancerId: row.freelancerId })
    : [];

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
    commission: row.commission,
    netAmount: row.netAmount,
    status: row.status,
    escrowLockedAt: row.escrowLockedAt,
    releasedAt: row.releasedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deliveryFiles,
  };
}

/* ============================================================================
 * أغلفة useActionState
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

export async function submitDeliveryAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };

  const contractId = parseId(formData.get('contractId'));
  const notes = (formData.get('notes') as string)?.trim() ?? '';
  const links = (formData.get('links') as string)?.trim() ?? '';
  const files = formData.getAll('files').filter(isFileLike);

  if (!contractId) return { success: false, message: 'معرّف العقد غير صالح' };
  if (!notes || notes.length < 10) return { success: false, message: 'أدخل ملاحظات التسليم (10 أحرف على الأقل)' };

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  if (!contract) return { success: false, message: 'العقد غير موجود' };
  if (contract.freelancerId !== currentUser.id) return { success: false, message: 'التسليم متاح للمستقل فقط' };
  if (contract.status !== 'active') return { success: false, message: `لا يمكن التسليم — حالة العقد: ${contract.status}` };

  try {
    const uploadedFiles: UploadResult[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadedFiles.push(
        await uploadToImageKit(
          buffer,
          file.name || `contract-${contractId}-delivery-file`,
          `/contracts/${contractId}/deliveries`,
        ),
      );
    }

    // تفعيل pending_delivery — موجود في schema و CHECK constraint
    await db.update(contracts).set({ status: 'pending_delivery', updatedAt: new Date() }).where(eq(contracts.id, contractId));

    const { getOrCreateConversation } = await import('@/lib/services/messages');
    const convId = await getOrCreateConversation({
      currentUserId: currentUser.id,
      otherUserId: contract.clientId,
      projectId: contract.projectId,
    });

    const { messages } = await import('@/db/schema');
    await db.insert(messages).values({
      conversationId: convId,
      senderId: currentUser.id,
      content: `📦 تسليم مشروع: ${notes}${links ? `\n🔗 الروابط: ${links}` : ''}${formatDeliveryFiles(uploadedFiles)}`,
      isRead: false,
    });

    const { conversations } = await import('@/db/schema');
    await db.update(conversations).set({ lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(conversations.id, convId));

    revalidatePath(`/dashboard/contracts/${contractId}`);
    revalidatePath('/dashboard/messages');

    return { success: true, message: 'تم تسليم المشروع بنجاح — بانتظار مراجعة العميل', redirectTo: `/dashboard/contracts/${contractId}` };
  } catch (e) {
    console.error('submitDelivery failed', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل التسليم' };
  }
}

export async function requestRevisionAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };

  const contractId = parseId(formData.get('contractId'));
  const reason = (formData.get('reason') as string)?.trim() ?? '';

  if (!contractId) return { success: false, message: 'معرّف العقد غير صالح' };
  if (!reason || reason.length < 10) return { success: false, message: 'أدخل سبب طلب التعديلات (10 أحرف على الأقل)' };

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  if (!contract) return { success: false, message: 'العقد غير موجود' };
  if (contract.clientId !== currentUser.id) return { success: false, message: 'طلب التعديلات متاح للعميل فقط' };
  if (contract.status !== 'active' && (contract.status as string) !== 'pending_delivery') {
    return { success: false, message: `لا يمكن طلب تعديلات — حالة العقد: ${contract.status}` };
  }

  try {
    if ((contract.status as string) === 'pending_delivery') {
      await db.update(contracts).set({ status: 'active', updatedAt: new Date() }).where(eq(contracts.id, contractId));
    }

    const { getOrCreateConversation } = await import('@/lib/services/messages');
    const convId = await getOrCreateConversation({
      currentUserId: currentUser.id,
      otherUserId: contract.freelancerId,
      projectId: contract.projectId,
    });

    const { messages } = await import('@/db/schema');
    await db.insert(messages).values({
      conversationId: convId,
      senderId: currentUser.id,
      content: `🔄 طلب تعديلات: ${reason}`,
      isRead: false,
    });

    const { conversations } = await import('@/db/schema');
    await db.update(conversations).set({ lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(conversations.id, convId));

    revalidatePath(`/dashboard/contracts/${contractId}`);
    revalidatePath('/dashboard/messages');

    return { success: true, message: 'تم إرسال طلب التعديلات للمستقل', redirectTo: `/dashboard/contracts/${contractId}` };
  } catch (e) {
    console.error('requestRevision failed', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل طلب التعديلات' };
  }
}

export async function raiseDisputeAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };

  const contractId = parseId(formData.get('contractId'));
  const reason = (formData.get('reason') as string)?.trim() ?? '';

  if (!contractId) return { success: false, message: 'معرّف العقد غير صالح' };
  if (!reason || reason.length < 10) return { success: false, message: 'أدخل سبب النزاع (10 أحرف على الأقل)' };

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  if (!contract) return { success: false, message: 'العقد غير موجود' };
  if (contract.clientId !== currentUser.id && contract.freelancerId !== currentUser.id) {
    return { success: false, message: 'غير مصرح' };
  }
  if (contract.status === 'completed' || contract.status === 'cancelled') {
    return { success: false, message: `لا يمكن فتح نزاع — العقد ${contract.status}` };
  }

  try {
    await db.update(contracts).set({ status: 'disputed', updatedAt: new Date() }).where(eq(contracts.id, contractId));

    const otherId = currentUser.id === contract.clientId ? contract.freelancerId : contract.clientId;

    const { getOrCreateConversation } = await import('@/lib/services/messages');
    const convId = await getOrCreateConversation({
      currentUserId: currentUser.id,
      otherUserId: otherId,
      projectId: contract.projectId,
    });

    const { messages } = await import('@/db/schema');
    await db.insert(messages).values({
      conversationId: convId,
      senderId: currentUser.id,
      content: `⚠️ فتح نزاع: ${reason} — سيتدخل فريق الدعم قريباً`,
      isRead: false,
    });

    const { conversations } = await import('@/db/schema');
    await db.update(conversations).set({ lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(conversations.id, convId));

    revalidatePath(`/dashboard/contracts/${contractId}`);
    revalidatePath('/dashboard/contracts');

    return { success: true, message: 'تم فتح النزاع — سيتواصل الدعم مع الطرفين', redirectTo: `/dashboard/contracts/${contractId}` };
  } catch (e) {
    console.error('raiseDispute failed', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل فتح النزاع' };
  }
}

