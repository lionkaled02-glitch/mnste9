'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات توثيق الهوية KYC (Server Actions) — المرحلة 8
 * ============================================================================
 *  - uploadKycDocuments(data) : رفع 3 وثائق (أمامي/خلفي/سيلفي) بتشفير
 *                               AES-256-GCM وتسجيل الطلب قيد المراجعة.
 *  - getKycStatus()           : حالة التوثيق للمستخدم الحالي (الجلسة).
 *  - reviewKyc(data)          : مراجعة الطلب من المشرف (اعتماد/رفض بسبب).
 *  - uploadKycDocumentsAction / reviewKycAction : أغلفة useActionState.
 *
 *  القاعدة الذهبية (موثّقة):
 *   KYC إلزامي للمستقلين فقط — قبل أي عمل: تقديم عرض، استلام دفعة، سحب.
 *   أصحاب العمل لا يحتاجونه إطلاقاً؛ لذا رفع الوثائق متاح للمستقلين فقط
 *   (بوابة الدور داخل الإجراء — دفاع متعدد الطبقات، والصفحة توجّه غير
 *   المستقلين إلى /dashboard مع رسالة «KYC للمستقلين فقط»).
 *
 *  قرار موثّق — التشفير المزدوج (بتصميم المخطط):
 *   1) محتوى كل ملف يُشفَّر بـ AES-256-GCM (encryptBuffer) ويُكتب خارج
 *      قاعدة البيانات — «الملفات مشفّرة خارج قاعدة البيانات».
 *   2) المسارات نفسها تُشفَّر (encryptData) قبل تخزينها في أعمدة
 *      kyc_documents — encrypted_file_path (العمود التاريخي NOT NULL
 *      ويحمل مسار الوجه الأمامي) وfront/back/selfie_file_path (هجرة 00003).
 *
 *  قرار موثّق — طلب واحد نشط:
 *   لا يُقبل رفع جديد عند وجود طلب قيد المراجعة أو حساب معتمد؛ الرفع
 *   متاح مجدداً بعد الرفض (إعادة تقديم وثائق أصح).
 *
 *  قرار موثّق — المراجعة (reviewKyc):
 *   للمشرفين فقط، وتُراجع الطلبات قيد الانتظار حصراً. الاعتماد يرفع
 *   users.is_kyc_verified للمستقل صاحب الطلب؛ والرفض يُسجَّل بسببه
 *   (rejection_reason) مع بقاء الحساب غير موثّق.
 *
 *  قرار موثّق — العقود (مرحلة قادمة):
 *   لا يوجد بعد src/app/actions/contracts.ts ولا جدول عقود في المخطط؛
 *   عند بنائها يجب التحقق من توثيق المستقل قبل إنشاء أي عقد (القاعدة
 *   الذهبية نفسها — بوابة دور + KYC داخل الإجراء).
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { kycDocuments, users } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { encryptBuffer, encryptData } from '@/lib/crypto';
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_DOCUMENT_TYPE_OPTIONS,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/lib/services/kyc-meta';
import { getKycStatus as getKycStatusForUser } from '@/lib/services/kyc';

/* ============================================================================
 * أدوات داخلية (نفس نمط بقية الإجراءات)
 * ========================================================================== */

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

const DOCUMENT_TYPE_VALUES = KYC_DOCUMENT_TYPE_OPTIONS.map(
  (option) => option.value,
) as [string, ...string[]];

const uploadSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPE_VALUES, {
    error: 'اختر نوع الوثيقة',
  }),
});

/** مجلد تخزين الوثائق المشفّرة (قابل للتوجيه من البيئة) */
function getStorageDir(): string {
  return process.env.KYC_STORAGE_DIR || 'storage/kyc';
}

/** خانات الملفات الثلاث — الاسم في النموذج والوصف ولواحق التخزين */
const FILE_SLOTS = [
  { field: 'frontDocument', suffix: 'front' },
  { field: 'backDocument', suffix: 'back' },
  { field: 'selfieDocument', suffix: 'selfie' },
] as const;

type FileSlotField = (typeof FILE_SLOTS)[number]['field'];

/**
 * فحص ملف واحد من خانة واحدة — يُعيد رسالة الخطأ المناسبة أو null.
 * (الحجم ≤ 5MB والصيغة JPG/PNG/WebP/PDF — نفس حدود المرحلة السابقة)
 */
function validateFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return 'هذا الحقل مطلوب — ارفع الملف';
  }
  if (file.size > KYC_MAX_FILE_SIZE_BYTES) {
    return 'حجم الملف يتجاوز 5 ميغابايت — اضغط الصورة أو امسحها بجودة أقل';
  }
  if (!KYC_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'صيغة الملف غير مدعومة — المسموح: JPG أو PNG أو WebP أو PDF';
  }
  return null;
}

/* ============================================================================
 * uploadKycDocuments — رفع الوثائق الثلاث (تشفير + إدراج قيد المراجعة)
 * ========================================================================== */

export async function uploadKycDocuments(
  data: unknown,
): Promise<AuthActionState> {
  // 1) الجلسة — داخل الإجراء (دفاع متعدد الطبقات)
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولاً أولاً لرفع وثائقك',
      redirectTo: '/login',
    };
  }

  // KYC متاح لأي مستخدم مسجل (client يمكنه الترقية لاحقاً إلى freelancer)
  // القاعدة: KYC إلزامي للمستقل فقط قبل تقديم عرض/سحب، لكن رفعه متاح للجميع

  // 3) استخراج المدخلات — نوع الوثيقة + الملفات الثلاثة (FormData فقط)
  if (!(data instanceof FormData)) {
    return { success: false, message: 'رفع الوثائق يتطلب نموذج ملفات' };
  }

  const parsed = uploadSchema.safeParse({
    documentType: data.get('documentType'),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const fieldErrors: Record<string, string[]> = {};
  const files = new Map<FileSlotField, File>();
  for (const slot of FILE_SLOTS) {
    const file = data.get(slot.field);
    const error = validateFile(file);
    if (error) {
      fieldErrors[slot.field] = [error];
    } else {
      files.set(slot.field, file as File);
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // 4) طلب واحد نشط: لا رفع جديد وإن كان الحساب موثّقاً أو هناك طلب قيد المراجعة
  const [account] = await db
    .select({ isKycVerified: users.isKycVerified })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!account) {
    return {
      success: false,
      message: 'تعذّر العثور على حسابك — سجّل دخولك من جديد',
    };
  }

  if (account.isKycVerified) {
    return {
      success: false,
      message: 'حسابك موثّق بالفعل — لا حاجة لرفع وثائق جديدة',
    };
  }

  const [activeRequest] = await db
    .select({ id: kycDocuments.id, status: kycDocuments.status })
    .from(kycDocuments)
    .where(
      and(
        eq(kycDocuments.userId, currentUser.id),
        eq(kycDocuments.status, 'pending'),
      ),
    )
    .orderBy(desc(kycDocuments.createdAt))
    .limit(1);

  if (activeRequest) {
    return {
      success: false,
      message: 'لديك طلب توثيق قيد المراجعة — انتظر نتيجته قبل رفع وثائق جديدة',
    };
  }

  // 5) التشفير والتخزين — كل ملف خارج القاعدة، ومساره مشفّر داخلها
  try {
    const storageDir = getStorageDir();
    await mkdir(storageDir, { recursive: true });

    /** مسار مشفّر لكل خانة */
    const encryptedPaths = new Map<FileSlotField, string>();

    for (const slot of FILE_SLOTS) {
      const file = files.get(slot.field);
      if (!file) continue; // مستحيل بعد الفحص — للحسم النوعي فقط

      const fileBytes = Buffer.from(await file.arrayBuffer());
      const encryptedContent = encryptBuffer(fileBytes);

      const fileName = `${currentUser.id}-${Date.now()}-${randomUUID()}-${slot.suffix}.enc`;
      const absolutePath = path.join(storageDir, fileName);
      await writeFile(absolutePath, encryptedContent);

      // المسار النسبي فقط (قابل للنقل بين البيئات) — ثم يُشفَّر للتخزين
      const relativePath = path.posix.join(
        storageDir.replace(/\\/g, '/'),
        fileName,
      );
      encryptedPaths.set(slot.field, encryptData(relativePath));
    }

    const frontPath = encryptedPaths.get('frontDocument')!;
    const backPath = encryptedPaths.get('backDocument')!;
    const selfiePath = encryptedPaths.get('selfieDocument')!;

    // 6) الإدراج — قيد المراجعة افتراضياً
    //    encrypted_file_path (العمود التاريخي NOT NULL) يحمل مسار الوجه
    //    الأمامي نفسه في front_file_path — توافق خلفي مع الصفوف القديمة.
    await db.insert(kycDocuments).values({
      userId: currentUser.id,
      encryptedFilePath: frontPath,
      frontFilePath: frontPath,
      backFilePath: backPath,
      selfieFilePath: selfiePath,
      documentType: parsed.data.documentType,
      status: 'pending',
    });

    revalidatePath('/dashboard/kyc');
    revalidatePath('/dashboard/settings');
    return {
      success: true,
      message: 'تم رفع وثائقك بنجاح — قيد المراجعة من فريق التوثيق',
    };
  } catch (error) {
    console.error('uploadKycDocuments failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء رفع الوثائق — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * getKycStatus — حالة التوثيق للمستخدم الحالي (من الجلسة)
 * ========================================================================== */

/**
 * حالة التوثيق الكاملة للمستخدم الحالي: is_kyc_verified من users + آخر
 * طلب (الحالة/النوع/سبب الرفض/تواريخ المراجعة).
 *
 * تُرجع null دون جلسة صالحة. الصفحة تستخدم النظيرة في طبقة الخدمات
 * (services/kyc.ts) مباشرة بنفس الاسم — هذا الغلاف للوفاء بواجهة
 * الإجراءات (يُستدعى من العملاء/السلاسل الأخرى إن لزم).
 */
export async function getKycStatus() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  return getKycStatusForUser(currentUser.id);
}

/* ============================================================================
 * reviewKyc — مراجعة طلب توثيق (مشرف فقط)
 * ========================================================================== */

const reviewSchema = z
  .object({
    kycId: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .coerce.number({ error: 'معرّف الطلب مطلوب' })
        .int()
        .positive('معرّف الطلب غير صالح'),
    ),
    decision: z.enum(['approved', 'rejected'], {
      error: 'القرار يجب أن يكون اعتماداً أو رفضاً',
    }),
    reason: z.string().trim().max(500, 'سبب الرفض طويل جداً (الحد 500 حرف)').optional(),
  })
  .refine((data) => data.decision !== 'rejected' || Boolean(data.reason), {
    message: 'سبب الرفض مطلوب عند رفض الطلب',
    path: ['reason'],
  });

/** تطبيع المدخلات: FormData (من النماذج) أو كائن (من API) → سجل بسيط */
function normalizeInput(data: unknown): Record<string, unknown> {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}

export async function reviewKyc(data: unknown): Promise<AuthActionState> {
  // 1) الجلسة والدور — المشرفون فقط
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لمراجعة طلبات التوثيق',
      redirectTo: '/login',
    };
  }
  if (currentUser.role !== 'admin') {
    return {
      success: false,
      message: 'مراجعة طلبات التوثيق متاحة للمشرفين فقط',
    };
  }

  // 2) التحقق من المدخلات
  const parsed = reviewSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { kycId, decision, reason } = parsed.data;

  // 3) الطلب موجود وقيد الانتظار (لا مراجعة مزدوجة)
  const [request] = await db
    .select({
      id: kycDocuments.id,
      userId: kycDocuments.userId,
      status: kycDocuments.status,
    })
    .from(kycDocuments)
    .where(eq(kycDocuments.id, kycId))
    .limit(1);

  if (!request) {
    return { success: false, message: 'طلب التوثيق غير موجود' };
  }
  if (request.status !== 'pending') {
    return { success: false, message: 'تمت مراجعة هذا الطلب مسبقاً' };
  }

  // 4) تسجيل القرار + أثر المراجعة (المراجِع والتاريخ — هجرة 00003)
  try {
    const [updated] = await db
      .update(kycDocuments)
      .set({
        status: decision,
        rejectionReason: decision === 'rejected' ? reason ?? null : null,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      })
      .where(eq(kycDocuments.id, kycId))
      .returning({ id: kycDocuments.id });

    if (!updated) {
      return { success: false, message: 'طلب التوثيق غير موجود' };
    }

    // 5) الاعتماد يرفع علم التوثيق للمستقل صاحب الطلب
    if (decision === 'approved') {
      await db
        .update(users)
        .set({ isKycVerified: true })
        .where(eq(users.id, request.userId));
    }

    revalidatePath('/dashboard/kyc');
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/wallet');
    revalidatePath('/freelancers');
    return {
      success: true,
      message:
        decision === 'approved'
          ? 'تم اعتماد طلب التوثيق — أصبح المستقل موثّقاً'
          : 'تم رفض طلب التوثيق وتسجيل السبب',
    };
  } catch (error) {
    console.error('reviewKyc failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء مراجعة الطلب — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * أغلفة متوافقة مع useActionState — (الحالة السابقة، FormData)
 * إجراءات خادم كاملة: تُمرَّر مباشرة إلى useActionState فتعمل النماذج
 * حتى مع تعطيل JavaScript (Progressive Enhancement).
 * ========================================================================== */

export async function uploadKycDocumentsAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return uploadKycDocuments(formData);
}

export async function reviewKycAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return reviewKyc(formData);
}
