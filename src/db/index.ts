/**
 * ============================================================================
 *  mnste9 — اتصال قاعدة البيانات (PostgreSQL على Neon عبر Drizzle ORM)
 * ============================================================================
 *  - المحرّك: drizzle-orm/node-postgres (يعتمد حزمة pg الموجودة في المشروع).
 *  - الرابط يُقرأ من متغير البيئة DATABASE_URL في ملف .env
 *    (Next.js يحمّل .env تلقائياً؛ drizzle-kit يحمّله عبر drizzle.config.ts).
 *  - اتصالات Neon تتطلب TLS؛ روابط Neon تتضمن عادةً ?sslmode=require
 *    فيتولّى pg التشفير تلقائياً. نضيف TLS صريحاً فقط إذا كان الرابط بعيداً
 *    وخالياً من sslmode، ونتخطاه للاتصالات المحلية (اختبارات محلية).
 * ============================================================================
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'متغير البيئة DATABASE_URL غير معرّف — أضف رابط الاتصال (Connection String) ' +
      'من لوحة تحكم Neon إلى ملف .env',
  );
}

/** اتصال محلي (تطوير/اختبار) لا يحتاج SSL */
const isLocalConnection = /localhost|127\.0\.0\.1|::1/.test(connectionString);

/** الرابط يتضمن توجيه SSL بالفعل (مثل روابط Neon الجاهزة) */
const urlSpecifiesSsl = /[?&]sslmode=/.test(connectionString);

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: isLocalConnection || urlSpecifiesSsl ? undefined : { rejectUnauthorized: true },
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;