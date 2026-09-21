'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات توثيق الهوية KYC (Server Actions)
 * ============================================================================
 *  - uploadKycDocument(data) : رفع وثيقة هوية (تشفير + تسجيل قيد المراجعة).
 *  - uploadKycDocumentAction : غلاف useActionState — (prevState, FormData).
 *
 *  قرار موثّق — التشفير المزدوج (بتصميم المخطط):
 *   1) محتوى الملف يُشفَّر بـ AES-256-GCM (encryptBuffer) ويُكتب خارج
 *      قاعدة البيانات — «الملفات مشفّرة خارج قاعدة البيانات».
 *   2) المسار نفسه يُشفَّر (encryptData) قبل تخزينه في العمود
 *      kyc_documents.encrypted_file_path — وهو الاستخدام الأساسي المصرَّح
 *      به في ترويسة src/lib/crypto.ts.
 *
 *  قرار موثّق — التخزين:
 *   المجلد من متغير البيئة KYC_STORAGE_DIR (الافتراضي storage/kyc داخل
 *   المشروع — مُستثنى من Git). في الإنتاج يُوجَّه إلى قرص/تخزين مناسب.
 *
 *  قرار موثّق — طلب واحد نشط:
 *   لا يُقبل رفع جديد عند وجود طلب قيد المراجعة أو حساب معتمد؛ الرفع
 *   متاح مجدداً بعد الرفض (إعادة تقديم وثيقة أصح).
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

/* ============================================================================
 * uploadKycDocument — رفع وثيقة (تشفير + إدراج قيد المراجعة)
 * ========================================================================== */

export async function uploadKycDocument(
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

  // 2) استخراج المدخلات — الحقل النصي + الملف (FormData فقط)
  if (!(data instanceof FormData)) {
    return { success: false, message: 'رفع الوثائق يتطلب نموذج ملفات' };
  }

  const parsed = uploadSchema.safeParse({
    documentType: data.get('documentType'),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const file = data.get('document');
  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      fieldErrors: { document: ['ارفع ملف الوثيقة (صورة أو PDF)'] },
    };
  }

  if (file.size > KYC_MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      fieldErrors: {
        document: ['حجم الملف يتجاوز 5 ميغابايت — اضغط الصورة أو الامسح بجودة أقل'],
      },
    };
  }

  if (!KYC_ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      fieldErrors: {
        document: ['صيغة الملف غير مدعومة — المسموح: JPG أو PNG أو WebP أو PDF'],
      },
    };
  }

  // 3) طلب واحد نشط: لا رفع جديد وإن كان الحساب موثّقاً أو هناك طلب قيد المراجعة
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
      message: 'لديك طلب توثيق قيد المراجعة — انتظر نتيجته قبل رفع وثيقة جديدة',
    };
  }

  // 4) التشفير والتخزين — المحتوى خارج القاعدة، والمسار مشفّر داخلها
  try {
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const encryptedContent = encryptBuffer(fileBytes);

    const storageDir = getStorageDir();
    await mkdir(storageDir, { recursive: true });

    const fileName = `${currentUser.id}-${Date.now()}-${randomUUID()}.enc`;
    const absolutePath = path.join(storageDir, fileName);
    await writeFile(absolutePath, encryptedContent);

    // المسار النسبي فقط (قابل للنقل بين البيئات) — ثم يُشفَّر للتخزين
    const relativePath = path.posix.join(
      storageDir.replace(/\\/g, '/'),
      fileName,
    );

    // 5) الإدراج — قيد المراجعة افتراضياً
    await db.insert(kycDocuments).values({
      userId: currentUser.id,
      encryptedFilePath: encryptData(relativePath),
      documentType: parsed.data.documentType,
      status: 'pending',
    });

    revalidatePath('/dashboard/kyc');
    revalidatePath('/dashboard/settings');
    return {
      success: true,
      message: 'تم رفع وثيقتك بنجاح — قيد المراجعة من فريق التوثيق',
    };
  } catch (error) {
    console.error('uploadKycDocument failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء رفع الوثيقة — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * غلاف متوافق مع useActionState — (الحالة السابقة، FormData)
 * ========================================================================== */

export async function uploadKycDocumentAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return uploadKycDocument(formData);
}
