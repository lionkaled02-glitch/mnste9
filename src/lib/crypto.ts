/**
 * ============================================================================
 *  mnste9 — طبقة التشفير (Encryption Utilities)
 * ============================================================================
 *  - encryptData(): تشفير نص باستخدام AES-256-GCM (تشفير موثَّق Authenticated).
 *  - decryptData(): فك التشفير مع كشف أي عبث بالمحتوى (وسم GCM).
 *  - hashData():   بصمة SHA-256 للتحقق من السلامة (وليست لكلمات المرور).
 *
 *  الاستخدام الأساسي: تشفير مسارات ملفات KYC قبل تخزينها في
 *  kyc_documents.encrypted_file_path (انظر المخطط src/db/schema.ts).
 *
 *  تصميم التشفير:
 *   - الخوارزمية: AES-256-GCM (سريعة + موثَّقة — أي تعديل في النص المشفر
 *     يُكشف عند فك التشفير عبر Auth Tag).
 *   - المفتاح: KYC_ENCRYPTION_KEY من البيئة — 32 بايت بصيغة hex (64 حرفاً).
 *   - IV عشوائي (12 بايت) لكل عملية تشفير — لا يُعاد استخدامه أبداً.
 *   - صيغة المخرجات: "v1.<base64url(iv || tag || ciphertext>" — بادئة إصدار
 *     تسمح بتغيير الخوارزمية مستقبلاً دون كسر البيانات القديمة.
 *
 *  تحذير أمني:
 *   hashData() ليست لباس كلمات المرور — لتلك استخدم bcrypt (مثبت في
 *   المشروع). كذلك لا تستخدم encryptData() لكلمات المرور.
 * ============================================================================
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

/* ============================================================================
 * ثوابت التنسيق
 * ========================================================================== */

/** بادئة الإصدار — تتيح تطوير الخوارزمية مستقبلاً */
const ENVELOPE_VERSION = 'v1';

/** طول المتجه الابتدائي (IV) بالبايت — القياسي لـ GCM */
const IV_LENGTH = 12;

/** طول وسم التوثيق (Auth Tag) بالبايت — القياسي لـ GCM */
const TAG_LENGTH = 16;

/* ============================================================================
 * إدارة مفتاح التشفير
 * ========================================================================== */

/** المفتاح مخزَّن مؤقتاً بعد أول تحقق (لا يُعاد قراءة البيئة كل مرة) */
let cachedKey: Buffer | null = null;

/** قراءة مفتاح AES-256 والتحقق من صحته (32 بايت hex = 64 حرفاً) */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.KYC_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      'متغير البيئة KYC_ENCRYPTION_KEY غير معرّف — ولِّده بـ openssl rand -hex 32 ' +
        'وضعه في ملف .env (32 بايت بصيغة hex = 64 حرفاً)',
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      'KYC_ENCRYPTION_KEY غير صالح — يجب أن يكون 32 بايت بصيغة hex (64 حرفاً)، ' +
        'مثال للتوليد: openssl rand -hex 32',
    );
  }

  cachedKey = Buffer.from(raw, 'hex');
  return cachedKey;
}

/* ============================================================================
 * encryptData — تشفير نص (AES-256-GCM)
 * ========================================================================== */

/**
 * تشفير نص حساس (مثل مسار ملف KYC) وإرجاع مغلّف واحد قابل للتخزين في عمود
 * نصي.
 *
 * @param plaintext النص الواضح المراد تشفيره
 * @returns نص بصيغة "v1.<base64url(iv || tag || ciphertext>"
 *
 * @example
 *   const stored = encryptData('/vault/kyc/user-42-passport.pdf.enc');
 *   // "v1.QOO8mR2x…"
 */
export function encryptData(plaintext: string): string {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptData يتوقع نصاً غير فارغ للتشفير');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 بايت

  const envelope = Buffer.concat([iv, authTag, ciphertext]);
  return `${ENVELOPE_VERSION}.${envelope.toString('base64url')}`;
}

/* ============================================================================
 * decryptData — فك التشفير مع كشف العبث
 * ========================================================================== */

/**
 * فك تشفير مخرجات encryptData.
 *
 * يرمي خطأً واضحاً في الحالات التالية:
 *   - صيغة المغلّف غير صحيحة أو إصدار غير مدعوم.
 *   - فشل وسم التوثيق (البيانات عُدِّلت أو المفتاح مختلف).
 *
 * @param payload النص المشفر بصيغة "v1.<base64url>"
 * @returns النص الواضح الأصلي
 *
 * @example
 *   const path = decryptData(stored); // "/vault/kyc/user-42-passport.pdf.enc"
 */
export function decryptData(payload: string): string {
  if (typeof payload !== 'string' || payload.length === 0) {
    throw new Error('decryptData يتوقع نصاً غير فارغ لفك التشفير');
  }

  const separatorIndex = payload.indexOf('.');
  if (separatorIndex === -1) {
    throw new Error('صيغة البيانات المشفرة غير صالحة (لا توجد بادئة إصدار)');
  }

  const version = payload.slice(0, separatorIndex);
  const encoded = payload.slice(separatorIndex + 1);

  if (version !== ENVELOPE_VERSION) {
    throw new Error(`إصدار التشفير غير مدعوم: ${version}`);
  }

  const envelope = Buffer.from(encoded, 'base64url');
  if (envelope.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error('البيانات المشفرة مبتورة أو تالفة');
  }

  const iv = envelope.subarray(0, IV_LENGTH);
  const authTag = envelope.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = envelope.subarray(IV_LENGTH + TAG_LENGTH);

  try {
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error(
      'فشل فك التشفير — البيانات معدَّلة أو KYC_ENCRYPTION_KEY مختلف عن مفتاح التشفير',
    );
  }
}

/* ============================================================================
 * hashData — بصمة SHA-256 للسلامة
 * ========================================================================== */

/**
 * حساب بصمة (hash) لنص — للاستخدام في التحقق من سلامة البيانات مثل بصمة
 * ملفات KYC قبل/بعد التخزين.
 *
 * ⚠️ ليست دالة تجزئة لكلمات المرور — لتلك استخدم bcrypt حصراً.
 *
 * @param data النص المطلوب تجزئته
 * @param algorithm خوارزمية التجزئة (الافتراضي sha256)
 * @returns البصمة بصيغة hex
 *
 * @example
 *   const fingerprint = hashData(fileContents); // "9f86d081884c7d65…"
 */
export function hashData(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  if (typeof data !== 'string') {
    throw new Error('hashData يتوقع نصاً');
  }

  return createHash(algorithm).update(data, 'utf8').digest('hex');
}

/* ============================================================================
 * encryptBuffer / decryptBuffer — تشفير الملفات الثنائية (KYC)
 * ========================================================================== */

/**
 * تشفير محتوى ملف ثنائي (Buffer) بـ AES-256-GCM — لوثائق KYC المخزَّنة
 * خارج قاعدة البيانات («الملفات مشفّرة خارج قاعدة البيانات» بحسب المخطط).
 *
 * نفس مغلف v1 الخاص بـ encryptData لكن على بايتات الملف مباشرة — فملفات
 * الهوية (صور/PDF) ليست نصوصاً UTF-8 صالحة فلا تمر عبر encryptData.
 *
 * @param bytes محتوى الملف الخام
 * @returns محتوى مشفر جاهز للكتابة إلى القرص (binary: iv || tag || ciphertext)
 *
 * @example
 *   const enc = encryptBuffer(await file.arrayBuffer());
 *   await writeFile(dest, enc);
 */
export function encryptBuffer(bytes: Buffer | ArrayBuffer | Uint8Array): Buffer {
  const data = bytes instanceof Buffer ? bytes : Buffer.from(bytes as ArrayBuffer);
  if (data.length === 0) {
    throw new Error('encryptBuffer يتوقع محتوى غير فارغ');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]);
}

/**
 * فك تشفير مخرجات encryptBuffer — يرمي خطأً عند أي عبث بالوسم (GCM).
 *
 * @param payload المحتوى المشفر المقروء من القرص
 * @returns محتوى الملف الأصلي
 */
export function decryptBuffer(payload: Buffer | Uint8Array): Buffer {
  const envelope = payload instanceof Buffer ? payload : Buffer.from(payload);
  if (envelope.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error('الملف المشفر مبتور أو تالف');
  }

  const iv = envelope.subarray(0, IV_LENGTH);
  const authTag = envelope.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = envelope.subarray(IV_LENGTH + TAG_LENGTH);

  try {
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error(
      'فشل فك تشفير الملف — المحتوى معدَّل أو KYC_ENCRYPTION_KEY مختلف',
    );
  }
}
