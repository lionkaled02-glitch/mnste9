/**
 * ============================================================================
 *  mnste9 — نظام المصادقة (Authentication)
 * ============================================================================
 *  الوظائف المصدَّرة:
 *   - hashPassword(password)     : تجزئة كلمة المرور بـ bcrypt.
 *   - verifyPassword(password, hash): مطابقة كلمة المرور مع التجزئة.
 *   - createSession(userId)      : إنشاء JWT (معاد تصديرها من session.ts).
 *   - verifySession(token)       : التحقق من JWT (معاد تصديرها من session.ts).
 *   - getCurrentUser()           : استرجاع المستخدم الحالي من كوكي الجلسة.
 *   - setSessionCookie(token)    : تعيين كوكي الجلسة (HttpOnly).
 *   - clearSessionCookie()       : حذف كوكي الجلسة.
 *
 *  معمارية الأمان:
 *   - كلمات المرور: bcrypt بتكلفة 12 (الحد المتوازن للأمان والأداء)، ولا
 *     تُخزَّن أو تُسجَّل أبداً كنص واضح.
 *   - الجلسة: JWT موقّع HS256 داخل كوكي HttpOnly + SameSite=Lax + Secure
 *     في الإنتاج — لا يمكن قراءته من JavaScript (حماية من XSS) ولا يُرسل
 *     مع طلبات المواقع الأخرى (حماية أساسية من CSRF).
 *   - getCurrentUser() يقرأ بيانات المستخدم من قاعدة البيانات عند كل
 *     استدعاء (لا يثق بحمولة الرمز beyond المعرّف) — أي تعديل أو حذف
 *     للحساب ينعكس فوراً.
 *   - الدوال الثقيلة (bcrypt/pg) معزولة في هذا الملف؛ ملف session.ts
 *     الخفيف هو ما يستورده middleware.ts.
 * ============================================================================
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  verifySession,
} from '@/lib/session';

/* ============================================================================
 * إعادة تصدير دوال الجلسة (jose/JWT) — راجع src/lib/session.ts
 * ========================================================================== */

export { createSession, verifySession, SESSION_COOKIE_NAME };

/* ============================================================================
 * ثوابت الأمان
 * ========================================================================== */

/** تكلفة bcrypt — 12 جولة (منصوص عليه في OWASP للإصدارات الحديثة) */
const BCRYPT_COST = 12;

/* ============================================================================
 * الأنواع
 * ========================================================================== */

/** بيانات المستخدم الآمنة للعرض — بلا كلمة المرور أبداً */
export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'freelancer' | 'admin';
  isKycVerified: boolean;
  createdAt: Date;
}

/** نتيجة موحّدة لدوال الإجراءات (Server Actions / API) */
export interface AuthActionState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}

/* ============================================================================
 * كلمات المرور (bcrypt)
 * ========================================================================== */

/**
 * تجزئة كلمة المرور بـ bcrypt.
 *
 * @param password كلمة المرور بالنص الواضح (من نموذج المستخدم)
 * @returns التجزئة الجاهزة للتخزين في users.password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * التحقق من كلمة المرور مقابل التجزئة المخزنة.
 *
 * @param password كلمة المرور المُدخلة عند تسجيل الدخول
 * @param hash     التجزئة المخزنة في قاعدة البيانات
 * @returns true إن تطابقت
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ============================================================================
 * الكوكيز (HttpOnly)
 * ========================================================================== */

/**
 * تعيين كوكي الجلسة — يُستدعى بعد تسجيل الدخول أو إنشاء حساب.
 * يعمل داخل Server Actions وRoute Handlers (سياق الكتابة).
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** حذف كوكي الجلسة — تسجيل الخروج */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/* ============================================================================
 * المستخدم الحالي
 * ========================================================================== */

/**
 * استرجاع المستخدم الحالي من كوكي الجلسة.
 *
 * التسلسل: كوكي → verifySession → استعلام قاعدة البيانات → SafeUser.
 * تُرجع null عند عدم وجود جلسة صالحة أو حذف المستخدم — لا ترمي خطأً.
 *
 * صالحة في Server Components وServer Actions وRoute Handlers.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const payload = await verifySession(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) return null;

  return {
    ...user,
    role: user.role as SafeUser['role'],
  };
}
