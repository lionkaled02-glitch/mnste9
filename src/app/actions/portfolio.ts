'use server';

/**
 * ============================================================================
 *  خدمات — إجراءات معرض الأعمال Portfolio (Server Actions)
 * ============================================================================
 *  - getMyPortfolio()                 : أعمال المستخدم الحالي (حتى 50).
 *  - getUserPortfolio(userId)         : أعمال مستخدم للعرض العام.
 *  - createPortfolioItemAction        : إضافة عمل (useActionState).
 *  - deletePortfolioItemSecureAction  : حذف عمل يملكه المستخدم (useActionState).
 *  - deletePortfolioItemAction        : اسم قديم — يفوّض إلى النسخة الآمنة.
 *
 *  قرار موثّق — صورة العمل (رفع من الجهاز):
 *   - المسار الطبيعي: العميل يرفع الصورة إلى /api/upload/portfolio ويصل هنا
 *     المسار المحلي /uploads/portfolio/<userId>-<timestamp>.<ext> في imageUrl.
 *   - مسار بديل (بلا JavaScript): يصل الملف نفسه في الحقل imageFile ويُحفظ
 *     هنا عبر lib/uploads (نفس التحقق: 5MB — JPG/PNG/WEBP).
 *   - المسار المحلي يجب أن يكون ملفاً رفعه المستخدم نفسه (البادئة userId-).
 *   - عند حذف العمل يُحذف ملف صورته المحلي من القرص (best-effort).
 *   - الروابط الخارجية http(s) تبقى مقبولة (بيانات قديمة / API).
 * ============================================================================
 */

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { portfolioItems } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { deleteLocalUpload, isLocalUploadUrl, isOwnedUploadUrl, saveUploadedImage } from '@/lib/uploads';

/* ============================================================================
 * التحقق (zod)
 * ========================================================================== */

const HTTP_URL_PATTERN = /^https?:\/\/.+/;

const portfolioSchema = z.object({
  title: z.string().min(3, 'العنوان 3 أحرف على الأقل').max(200, 'العنوان طويل جداً (200 حرف كحد أقصى)'),
  description: z.string().max(1000, 'الوصف طويل جداً (1000 حرف كحد أقصى)').optional().default(''),
  externalUrl: z
    .string()
    .max(500, 'الرابط طويل جداً')
    .optional()
    .refine((v) => !v || HTTP_URL_PATTERN.test(v), 'رابط خارجي غير صالح (يجب أن يبدأ بـ http/https)'),
  imageUrl: z
    .string()
    .max(500, 'رابط الصورة طويل جداً')
    .optional()
    .refine(
      (v) => !v || HTTP_URL_PATTERN.test(v) || isLocalUploadUrl(v, 'portfolio'),
      'الصورة غير صالحة — ارفع صورة من جهازك (JPG/PNG/WEBP حتى 5MB)',
    ),
});

/* ============================================================================
 * الأنواع والأدوات
 * ========================================================================== */

export interface PortfolioItemDTO {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

function parseId(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

function toDTO(r: typeof portfolioItems.$inferSelect): PortfolioItemDTO {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    externalUrl: r.externalUrl,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
  };
}

/** ملف الصورة المرفوع مباشرة مع النموذج (المسار البديل بلا JavaScript) */
function extractImageFile(formData: FormData): File | null {
  const file = formData.get('imageFile');
  return file instanceof File && file.size > 0 ? file : null;
}

/* ============================================================================
 * القراءة
 * ========================================================================== */

export async function getMyPortfolio(): Promise<PortfolioItemDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  return getUserPortfolio(currentUser.id);
}

export async function getUserPortfolio(userId: number): Promise<PortfolioItemDTO[]> {
  const rows = await db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.userId, userId))
    .orderBy(desc(portfolioItems.createdAt))
    .limit(50);

  return rows.map(toDTO);
}

/* ============================================================================
 * الإضافة
 * ========================================================================== */

export async function createPortfolioItemAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  }

  const raw = {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    externalUrl: String(formData.get('externalUrl') ?? '').trim(),
    imageUrl: String(formData.get('imageUrl') ?? '').trim(),
  };

  const parsed = portfolioSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'title');
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, message: 'تحقق من الحقول', fieldErrors };
  }

  const { title, description, externalUrl } = parsed.data;
  let imageUrl = parsed.data.imageUrl || null;

  // صورة مرفوعة مباشرة مع النموذج (بلا JavaScript) — تحلّ محل أي قيمة نصية
  let savedHere: string | null = null;
  const imageFile = extractImageFile(formData);
  if (imageFile) {
    const saved = await saveUploadedImage(imageFile, 'portfolio', currentUser.id);
    if (!saved.ok) {
      return { success: false, message: 'تحقق من الحقول', fieldErrors: { imageUrl: [saved.error] } };
    }
    imageUrl = saved.url;
    savedHere = saved.url;
  }

  // مسار محلي يجب أن يكون ملفاً رفعه هذا المستخدم (لا استخدام صور الآخرين)
  if (imageUrl && isLocalUploadUrl(imageUrl, 'portfolio') && !isOwnedUploadUrl(imageUrl, 'portfolio', currentUser.id)) {
    return {
      success: false,
      message: 'تحقق من الحقول',
      fieldErrors: { imageUrl: ['الصورة غير صالحة — ارفع صورة من جهازك'] },
    };
  }

  try {
    await db.insert(portfolioItems).values({
      userId: currentUser.id,
      title,
      description: description || null,
      externalUrl: externalUrl || null,
      imageUrl,
    });

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تمت إضافة العمل إلى معرض أعمالك' };
  } catch (e) {
    console.error('createPortfolioItem failed:', e);
    // لا نترك ملفاً يتيماً إن فشل الإدراج بعد أن حفظنا الصورة هنا
    if (savedHere) await deleteLocalUpload(savedHere);
    return { success: false, message: 'تعذّر إضافة العمل — حاول مرة أخرى' };
  }
}

/* ============================================================================
 * الحذف — بشرط الملكية (id + userId) وحذف ملف الصورة المحلي بعده
 * ========================================================================== */

export async function deletePortfolioItemSecureAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };

  const id = parseId(formData.get('id'));
  if (!id) return { success: false, message: 'معرّف غير صالح' };

  try {
    const [deleted] = await db
      .delete(portfolioItems)
      .where(and(eq(portfolioItems.id, id), eq(portfolioItems.userId, currentUser.id)))
      .returning({ imageUrl: portfolioItems.imageUrl });

    if (!deleted) return { success: false, message: 'العمل غير موجود أو لا تملكه' };

    if (deleted.imageUrl && isLocalUploadUrl(deleted.imageUrl, 'portfolio')) {
      await deleteLocalUpload(deleted.imageUrl);
    }

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تم حذف العمل' };
  } catch (e) {
    console.error('deletePortfolioItem failed:', e);
    return { success: false, message: 'تعذّر حذف العمل — حاول مرة أخرى' };
  }
}

/** اسم قديم محفوظ للتوافق — يفوّض إلى النسخة الآمنة */
export async function deletePortfolioItemAction(prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  return deletePortfolioItemSecureAction(prev, formData);
}
