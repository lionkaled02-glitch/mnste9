'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createPortfolioItemAction } from '@/app/actions/portfolio';
import { uploadKycDocumentsAction } from '@/app/actions/kyc';
import { db } from '@/db';
import { users } from '@/db/schema';
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
