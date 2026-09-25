'use server';

import { count, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createPortfolioItemAction } from '@/app/actions/portfolio';
import { uploadKycDocumentsAction } from '@/app/actions/kyc';
import { db } from '@/db';
import { portfolioItems, users } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

const PHONE_PATTERN = /^[+\d][\d\s\-()]{5,29}$/;

const phoneSchema = z.object({
  phone: z
    .string({ error: 'رقم الجوال مطلوب' })
    .trim()
    .min(6, 'رقم الجوال قصير جداً')
    .max(30, 'رقم الجوال طويل جداً')
    .regex(PHONE_PATTERN, 'صيغة رقم الجوال غير صحيحة — استخدم صيغة دولية مثل +967771234567'),
});

const bioSchema = z.object({
  bio: z
    .string({ error: 'النبذة مطلوبة' })
    .trim()
    .min(40, 'اكتب نبذة أوضح — 40 حرفاً على الأقل')
    .max(1000, 'النبذة طويلة جداً (الحد 1000 حرف)'),
});

const skillsSchema = z.object({
  skills: z
    .string({ error: 'المهارات مطلوبة' })
    .trim()
    .min(2, 'أضف مهارة واحدة على الأقل')
    .max(500, 'المهارات طويلة جداً (الحد 500 حرف)')
    .refine(
      (value) => value.split(',').map((s) => s.trim()).filter(Boolean).length > 0,
      'أضف مهارة واحدة على الأقل',
    ),
});

const HTTP_URL_PATTERN = /^https?:\/\/.+/;
const LOCAL_PORTFOLIO_IMAGE_PATTERN = /^\/uploads\/portfolio\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

const portfolioV2Schema = z.object({
  title: z.string().trim().min(3, 'عنوان العمل 3 أحرف على الأقل').max(200, 'العنوان طويل جداً (200 حرف كحد أقصى)'),
  description: z.string().trim().min(20, 'وصف العمل يجب أن يكون 20 حرفاً على الأقل').max(2000, 'الوصف طويل جداً (2000 حرف كحد أقصى)'),
  externalUrl: z
    .string()
    .trim()
    .max(500, 'الرابط طويل جداً')
    .optional()
    .refine((value) => !value || HTTP_URL_PATTERN.test(value), 'رابط خارجي غير صالح'),
  imageUrls: z
    .string()
    .transform((value, ctx) => {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) throw new Error('invalid');
        return parsed.map((item) => item.trim()).filter(Boolean);
      } catch {
        ctx.addIssue({ code: 'custom', message: 'صور العمل غير صالحة' });
        return z.NEVER;
      }
    })
    .refine((urls) => urls.length >= 3, 'الحد الأدنى 3 صور لكل عمل')
    .refine((urls) => urls.length <= 10, 'الحد الأقصى 10 صور لكل عمل')
    .refine((urls) => urls.every((url) => LOCAL_PORTFOLIO_IMAGE_PATTERN.test(url)), 'مسارات الصور غير صالحة'),
  attachmentUrl: z
    .string()
    .trim()
    .max(500, 'رابط الملف طويل جداً')
    .optional()
    .refine((value) => !value || LOCAL_PORTFOLIO_IMAGE_PATTERN.test(value), 'مسار الملف غير صالح'),
  attachmentName: z.string().trim().max(255, 'اسم الملف طويل جداً').optional(),
});


async function requireFreelancer(): Promise<{ id: number } | AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  if (currentUser.role !== 'freelancer') return { success: false, message: 'إعداد الحساب متاح للمستقلين فقط', redirectTo: '/dashboard' };
  return { id: currentUser.id };
}

function revalidateSetup() {
  revalidatePath('/dashboard/setup');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
}

export async function updateSetupPhoneAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const parsed = phoneSchema.safeParse({ phone: formData.get('phone') });
  if (!parsed.success) return { success: false, fieldErrors: zodFieldErrors(parsed.error) };

  await db.update(users).set({ phone: parsed.data.phone }).where(eq(users.id, user.id));
  revalidateSetup();
  return { success: true, message: 'تم حفظ رقم الجوال' };
}

export async function updateSetupBioAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const parsed = bioSchema.safeParse({ bio: formData.get('bio') });
  if (!parsed.success) return { success: false, fieldErrors: zodFieldErrors(parsed.error) };

  await db.update(users).set({ bio: parsed.data.bio }).where(eq(users.id, user.id));
  revalidateSetup();
  return { success: true, message: 'تم حفظ النبذة التعريفية' };
}

export async function updateSetupSkillsAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const normalized = String(formData.get('skills') ?? '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 30)
    .join(', ');

  const parsed = skillsSchema.safeParse({ skills: normalized });
  if (!parsed.success) return { success: false, fieldErrors: zodFieldErrors(parsed.error) };

  await db.update(users).set({ skills: parsed.data.skills }).where(eq(users.id, user.id));
  revalidateSetup();
  return { success: true, message: 'تم حفظ المهارات' };
}

export async function submitSetupKycAction(prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const result = await uploadKycDocumentsAction(prev, formData);
  revalidateSetup();
  return result.success ? { ...result, message: result.message ?? 'تم رفع وثائق التوثيق' } : result;
}

export async function submitSetupPortfolioAction(prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const result = await createPortfolioItemAction(prev, formData);
  revalidateSetup();
  return result.success ? { ...result, message: result.message ?? 'تمت إضافة العمل' } : result;
}


export interface SetupPortfolioResult extends AuthActionState {
  portfolioCount?: number;
  coverUrl?: string;
}

export async function createSetupPortfolioWorkAction(formData: FormData): Promise<SetupPortfolioResult> {
  const user = await requireFreelancer();
  if ('success' in user) return user;

  const parsed = portfolioV2Schema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    externalUrl: String(formData.get('externalUrl') ?? ''),
    imageUrls: String(formData.get('imageUrls') ?? '[]'),
    attachmentUrl: String(formData.get('attachmentUrl') ?? ''),
    attachmentName: String(formData.get('attachmentName') ?? ''),
  });

  if (!parsed.success) return { success: false, message: 'تحقق من حقول العمل', fieldErrors: zodFieldErrors(parsed.error) };

  const { title, description, externalUrl, imageUrls, attachmentUrl, attachmentName } = parsed.data;
  const coverUrl = imageUrls[0];

  await db.insert(portfolioItems).values({
    userId: user.id,
    title,
    description,
    externalUrl: externalUrl || null,
    imageUrl: coverUrl,
    images: imageUrls,
    coverImageUrl: coverUrl,
    attachmentUrl: attachmentUrl || null,
    attachmentName: attachmentName || null,
  });

  const [row] = await db.select({ value: count() }).from(portfolioItems).where(eq(portfolioItems.userId, user.id));
  const portfolioCount = Number(row?.value ?? 0);

  revalidateSetup();
  return {
    success: true,
    message: portfolioCount >= 3 ? 'تمت إضافة العمل — اكتمل معرض الأعمال' : `تمت إضافة العمل (${portfolioCount}/3)`,
    portfolioCount,
    coverUrl,
  };
}
