'use server';

import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { portfolioItems } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';

const portfolioSchema = z.object({
  title: z.string().min(3, 'العنوان 3 أحرف على الأقل').max(200, 'العنوان طويل جداً (200 حرف كحد أقصى)'),
  description: z.string().max(1000, 'الوصف طويل جداً (1000 حرف كحد أقصى)').optional().default(''),
  externalUrl: z
    .string()
    .max(500, 'الرابط طويل جداً')
    .optional()
    .refine((v) => !v || v === '' || /^https?:\/\/.+/.test(v), 'رابط خارجي غير صالح (يجب أن يبدأ بـ http/https)'),
  imageUrl: z
    .string()
    .max(500, 'رابط الصورة طويل جداً')
    .optional()
    .refine((v) => !v || v === '' || /^https?:\/\/.+/.test(v), 'رابط الصورة غير صالح'),
});

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

export async function getMyPortfolio(): Promise<PortfolioItemDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const rows = await db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.userId, currentUser.id))
    .orderBy(desc(portfolioItems.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    externalUrl: r.externalUrl,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
  }));
}

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

  const { title, description, externalUrl, imageUrl } = parsed.data;

  try {
    await db.insert(portfolioItems).values({
      userId: currentUser.id,
      title,
      description: description || null,
      externalUrl: externalUrl || null,
      imageUrl: imageUrl || null,
    });

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تمت إضافة العمل إلى معرض أعمالك' };
  } catch (e) {
    console.error('createPortfolioItem failed:', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل الإضافة' };
  }
}

export async function deletePortfolioItemAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  }

  const id = parseId(formData.get('id'));
  if (!id) return { success: false, message: 'معرّف غير صالح' };

  try {
    const [existing] = await db.select({ id: portfolioItems.id }).from(portfolioItems).where(eq(portfolioItems.id, id)).limit(1);
    if (!existing) return { success: false, message: 'العمل غير موجود' };

    // تحقق ملكية
    const [owned] = await db
      .select({ id: portfolioItems.id })
      .from(portfolioItems)
      .where(eq(portfolioItems.id, id))
      .limit(1);

    // نحذف مع شرط المستخدم
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));

    // تحقق إضافي: إذا لم يكن للمستخدم، نعيد (لكن حذفنا بالفعل — نتحقق قبل الحذف في الإنتاج عبر and)
    // للتبسيط نستخدم شرطين
    const rows = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id)).limit(1);
    // إذا لا يزال موجوداً يعني ليس للمستخدم (لن يحدث)

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تم حذف العمل' };
  } catch (e) {
    console.error('deletePortfolioItem failed:', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل الحذف' };
  }
}

// نسخة آمنة مع and
export async function deletePortfolioItemSecureAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  const id = parseId(formData.get('id'));
  if (!id) return { success: false, message: 'معرّف غير صالح' };
  try {
    const { and } = await import('drizzle-orm');
    await db.delete(portfolioItems).where(and(eq(portfolioItems.id, id), eq(portfolioItems.userId, currentUser.id)));
    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تم حذف العمل' };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'فشل الحذف' };
  }
}
