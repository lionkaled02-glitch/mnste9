'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
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

export interface PortfolioItem {
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

export async function getMyPortfolio(): Promise<PortfolioItem[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  try {
    const result = await db.execute(sql`
      SELECT id, user_id as \"userId\", title, description, external_url as \"externalUrl\", image_url as \"imageUrl\", created_at as \"createdAt\"
      FROM portfolio_items
      WHERE user_id = ${currentUser.id}
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const rows = (result as any).rows ?? result;
    return (rows as any[]).map((r: any) => ({
      id: Number(r.id),
      userId: Number(r.userId ?? r.user_id),
      title: r.title,
      description: r.description ?? null,
      externalUrl: r.externalUrl ?? r.external_url ?? null,
      imageUrl: r.imageUrl ?? r.image_url ?? null,
      createdAt: r.createdAt ? new Date(r.createdAt) : r.created_at ? new Date(r.created_at) : new Date(),
    }));
  } catch (e) {
    console.error('getMyPortfolio failed (table may not exist yet):', e);
    return [];
  }
}

export async function createPortfolioItemAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
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
    await db.execute(sql`
      INSERT INTO portfolio_items (user_id, title, description, external_url, image_url, created_at, updated_at)
      VALUES (${currentUser.id}, ${title}, ${description || null}, ${externalUrl || null}, ${imageUrl || null}, NOW(), NOW())
    `);

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تمت إضافة العمل إلى معرض أعمالك' };
  } catch (e) {
    console.error('createPortfolioItem failed:', e);
    // إذا الجدول غير موجود في بيئة التطوير المحلية، نعيد رسالة واضحة
    const msg = e instanceof Error ? e.message : 'فشل الإضافة';
    if (msg.includes('does not exist') || msg.includes('portfolio_items')) {
      return { success: false, message: 'جدول معرض الأعمال غير موجود في قاعدة البيانات المحلية — سيعمل في الإنتاج' };
    }
    return { success: false, message: msg };
  }
}

export async function deletePortfolioItemAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  }

  const id = parseId(formData.get('id'));
  if (!id) return { success: false, message: 'معرّف غير صالح' };

  try {
    const check = await db.execute(sql`
      SELECT id FROM portfolio_items WHERE id = ${id} AND user_id = ${currentUser.id} LIMIT 1
    `);
    const rows = (check as any).rows ?? check;
    if (!rows || (rows as any[]).length === 0) {
      return { success: false, message: 'العمل غير موجود أو ليس لك' };
    }

    await db.execute(sql`DELETE FROM portfolio_items WHERE id = ${id} AND user_id = ${currentUser.id}`);

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'تم حذف العمل' };
  } catch (e) {
    console.error('deletePortfolioItem failed:', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل الحذف' };
  }
}
