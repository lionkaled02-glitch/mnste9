'use server';

import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { createSession, getCurrentUser, setSessionCookie, type AuthActionState } from '@/lib/auth';

const APP_NAME = 'خدمات';

async function requestInfo() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown',
    userAgent: h.get('user-agent') ?? '',
  };
}

async function buildQrCode(email: string, secret: string) {
  const otpauthUrl = generateURI({ issuer: APP_NAME, label: email, secret });
  return QRCode.toDataURL(otpauthUrl);
}

export async function generate2FASecret(): Promise<{ success: boolean; qrCodeUrl?: string; secret?: string; message?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'غير مصرح' };
  if (currentUser.role !== 'admin') return { success: false, message: 'الأدمن فقط' };

  const [user] = await db
    .select({ email: users.email, twoFactorSecret: users.twoFactorSecret, twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!user) return { success: false, message: 'المستخدم غير موجود' };
  if (user.twoFactorEnabled) return { success: false, message: '2FA مفعّل بالفعل' };

  if (user.twoFactorSecret) {
    const qrCodeUrl = await buildQrCode(user.email, user.twoFactorSecret);
    return { success: true, secret: user.twoFactorSecret, qrCodeUrl };
  }

  const secret = generateSecret();
  await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, currentUser.id));
  const qrCodeUrl = await buildQrCode(user.email, secret);
  revalidatePath('/admin/security/2fa');
  return { success: true, secret, qrCodeUrl };
}

export async function cancel2FASetup(): Promise<{ success: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'غير مصرح' };
  if (currentUser.role !== 'admin') return { success: false, message: 'الأدمن فقط' };

  const [user] = await db.select({ twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq(users.id, currentUser.id)).limit(1);
  if (!user || user.twoFactorEnabled) return { success: false, message: 'لا يمكن إلغاء إعداد مفعّل' };

  await db.update(users).set({ twoFactorSecret: null }).where(eq(users.id, currentUser.id));
  revalidatePath('/admin/security/2fa');
  return { success: true, message: 'تم إلغاء إعداد 2FA' };
}

export async function verify2FACode(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'غير مصرح' };

  const code = String(formData.get('code') ?? '').trim();
  const [user] = await db.select({ twoFactorSecret: users.twoFactorSecret }).from(users).where(eq(users.id, currentUser.id)).limit(1);
  if (!user?.twoFactorSecret) return { success: false, message: 'لم يتم توليد Secret بعد' };

  const result = verifySync({ token: code, secret: user.twoFactorSecret });
  if (!result.valid) return { success: false, message: 'الرمز غير صحيح' };

  await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, currentUser.id));
  revalidatePath('/admin/security/2fa');
  return { success: true, message: 'تم تفعيل 2FA بنجاح' };
}

export async function disable2FA(): Promise<{ success: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'غير مصرح' };
  if (currentUser.role !== 'admin') return { success: false, message: 'الأدمن فقط' };

  await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq(users.id, currentUser.id));
  revalidatePath('/admin/security/2fa');
  return { success: true, message: 'تم إلغاء 2FA' };
}

export async function verify2FAOnLogin(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const code = String(formData.get('code') ?? '').trim();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) return { success: false, message: 'خطأ في البيانات' };

  const result = verifySync({ token: code, secret: user.twoFactorSecret });
  if (!result.valid) return { success: false, message: 'الرمز غير صحيح' };

  const { ip, userAgent } = await requestInfo();
  const token = await createSession(user.id);
  await setSessionCookie(token);
  await db.update(users).set({ lastLoginAt: new Date(), lastLoginIp: ip }).where(eq(users.id, user.id));
  await db.insert(sessions).values({ userId: user.id, token, ip, userAgent, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });

  return { success: true, message: 'تم التحقق بنجاح', redirectTo: '/admin' };
}
