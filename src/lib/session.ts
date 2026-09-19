/**
 * ============================================================================
 *  mnste9 — الجلسات (JWT) — وحدة آمنة لبيئات Edge/Proxy
 * ============================================================================
 *  - createSession(userId): توقيع JWT (HS256) يحمل معرّف المستخدم.
 *  - verifySession(token): التحقق من التوقيع والصلاحية وإرجاع الحمولة.
 *
 *  لماذا ملف منفصل عن src/lib/auth.ts؟
 *   هذا الملف "خفيف الاعتماديات" (jose فقط — بلا bcrypt أو pg أو Drizzle)
 *   لأنه يُستورد من src/middleware.ts الذي يعمل في سياق منفصل عن تطبيق
 *   Next.js الرئيسي ولا يجب أن يسحب معه وحدات قاعدة البيانات أو الوحدات
 *   الأصلية (native modules).
 *
 *  تصميم الرمز:
 *   - الخوارزمية: HS256 بمفتاح NEXTAUTH_SECRET (32 بايت على الأقل).
 *   - الصلاحية: 7 أيام (قابلة للتعديل من SESSION_MAX_AGE_SECONDS).
 *   - المُعرّف: sub = معرّف المستخدم (رقمي)، مع iat/exp من jose.
 *   - لا نضع الأدوار في الرمز — تُقرأ من قاعدة البيانات عند كل طلب حتى
 *     لا تتصادم تغييرات الدور (مثل selectAccountType) مع رموز قديمة.
 * ============================================================================
 */

import { SignJWT, jwtVerify } from 'jose';

/** اسم كوكي الجلسة — مشترك بين auth.ts وmiddleware.ts */
export const SESSION_COOKIE_NAME = 'mnste9_session';

/** صلاحية الجلسة بالثواني (7 أيام) */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** حمولة الجلسة بعد التحقق */
export interface SessionPayload {
  userId: number;
  issuedAt: number;
  expiresAt: number;
}

/** قراءة المفتاح السري مع فحص صرامة (fail-fast) */
function getSessionSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'متغير البيئة NEXTAUTH_SECRET غير معرّف أو أقصر من 32 بايت — ' +
        'ولِّده بـ openssl rand -base64 32 وضعه في ملف .env',
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * إنشاء رمز جلسة (JWT) لمستخدم.
 *
 * @param userId معرّف المستخدم من جدول users
 * @returns رمز JWT موقّع بصيغة نصية جاهز للتخزين في كوكي
 */
export async function createSession(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

/**
 * التحقق من رمز جلسة.
 *
 * سياسة أمنية (fail-closed): أي فشل — توقيع خاطئ، انتهاء صلاحية، رمز
 * تالف، أو غياب المفتاح — يُرجع null بدل رمي خطأ، كي تُعامل الجلسة
 * كغير موثّقة فوراً في المسارات المحمية.
 *
 * @param token رمز JWT من الكوكي
 * @returns حمولة الجلسة أو null إن كان الرمز غير صالح
 */
export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (typeof token !== 'string' || token.length === 0) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    return {
      userId,
      issuedAt: typeof payload.iat === 'number' ? payload.iat : 0,
      expiresAt: typeof payload.exp === 'number' ? payload.exp : 0,
    };
  } catch {
    return null;
  }
}
