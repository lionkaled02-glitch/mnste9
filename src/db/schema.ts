/**
 * ============================================================================
 *  mnste9 — مخطط قاعدة البيانات (Drizzle ORM / PostgreSQL)
 * ============================================================================
 *  هذه الترجمة البرمجية المطابقة 1:1 لملفات الهجرة:
 *    database/migrations/2026_09_19_000001_create_platform_tables.sql
 *    database/migrations/2026_09_21_000002_add_user_profile_fields.sql
 *      (أعمدة الملف الشخصي والإعدادات المضافة إلى users — المرحلة 6)
 *    database/migrations/2026_09_21_000003_kyc_full_support.sql
 *      (أعمدة KYC الكامل: 3 وثائق + بيانات المراجعة — المرحلة 8)
 *    database/migrations/2026_09_21_000004_create_contracts.sql
 *      (جدول العقود + العمولة — المرحلة 9 — المواصفة الدقيقة)
 *
 *  ملاحظات معمارية:
 *   - مصدر الحقيقة لإنشاء القاعدة هو ملف الـ SQL (الذي يتضمن أيضاً Triggers
 *     تحديث updated_at، وهي ميزة لا يستطيع Drizzle التعبير عنها في المخطط).
 *   - هذا الملف هو طبقة الأنواع والاستعلام الآمن (Type-safe) للتطبيق، وقد
 *     تم التحقق من تطابقه البنيوي مع ملف الهجرة (نفس الجداول/الأعمدة/
 *     القيود/الفهارس/أسمائها حرفياً).
 *   - عمود updated_at يحمل ‎$onUpdate‎ ليُحدَّث تلقائياً في تحديثات Drizzle
 *     (يكمّل عمل Trigger القاعدة إن أُنشئت القاعدة عبر drizzle-kit push).
 *   - الأعمدة المالية NUMERIC تُمثَّل كنص (string) في TypeScript عمداً
 *     لتجنّب أخطاء الفاصلة العائمة في حسابات المال.
 * ============================================================================
 */

import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

/* ============================================================================
 * 1) أنواع ENUM المخصصة — بقيم مطابقة حرفياً لملف الهجرة
 * ========================================================================== */

/** طرق الدفع المدعومة حصراً: الكريمي (حوالات محلية) + PayPal */
export const paymentMethodEnum = pgEnum('payment_method_enum', ['kuraimi', 'paypal']);

/** حالات المعاملة المالية */
export const transactionStatusEnum = pgEnum('transaction_status_enum', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

/** أنواع الحركات على المحفظة: إيداع / سحب / احتجاز ضمان / تحرير ضمان / عمولة المنصة */
export const transactionTypeEnum = pgEnum('transaction_type_enum', [
  'deposit',
  'withdrawal',
  'escrow_lock',
  'escrow_release',
  'commission',
]);

/** حالات المشروع */
export const projectStatusEnum = pgEnum('project_status_enum', [
  'open',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * العملات المدعومة في المنصة حصراً: الدولار الأمريكي (USD) والريال
 * السعودي (SAR) — بنك الكريمي لا يدعم الريال اليمني (YER).
 */
export const currencyEnum = pgEnum('currency_enum', ['USD', 'SAR']);

/* ============================================================================
 * 2) الجداول والقيود (CHECK / UNIQUE / FK) والفهارس
 * ========================================================================== */

/** أداة داخلية: عمود المعرّف BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY */
const identityId = (name: string) => bigint(name, { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey();

/** أداة داخلية: عمودا الطوابع الزمنية created_at / updated_at */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ---------------------------------------------------------------------------
 * users — المستخدمون (عميل / مستقل / مشرف)
 * ------------------------------------------------------------------------- */
export const users = pgTable(
  'users',
  {
    id: identityId('id'),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    isKycVerified: boolean('is_kyc_verified').notNull().default(false),
    ...timestamps,
    phone: varchar('phone', { length: 30 }),
    city: varchar('city', { length: 100 }),
    preferredCurrency: currencyEnum('preferred_currency'),
    skills: text('skills'),
    bio: text('bio'),
    hourlyRate: numeric('hourly_rate', { precision: 15, scale: 2 }),
    notifyEmail: boolean('notify_email').notNull().default(true),
    notifySms: boolean('notify_sms').notNull().default(true),
  },
  (t) => [
    unique('uq_users_email').on(t.email),
    check('ck_users_role', sql`${t.role} IN ('client', 'freelancer', 'admin')`),
    check(
      'ck_users_hourly_rate_positive',
      sql`${t.hourlyRate} IS NULL OR ${t.hourlyRate} > 0`,
    ),
  ],
);

/* ---------------------------------------------------------------------------
 * wallets — المحافظ
 * ------------------------------------------------------------------------- */
export const wallets = pgTable(
  'wallets',
  {
    id: identityId('id'),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
    pendingBalance: numeric('pending_balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
    ...timestamps,
  },
  (t) => [
    unique('uq_wallets_user_id').on(t.userId),
    check('ck_wallets_balance_non_negative', sql`${t.balance} >= 0`),
    check('ck_wallets_pending_balance_non_negative', sql`${t.pendingBalance} >= 0`),
    foreignKey({
      name: 'fk_wallets_user_id',
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
  ],
);

/* ---------------------------------------------------------------------------
 * transactions — الحركات المالية
 * ------------------------------------------------------------------------- */
export const transactions = pgTable(
  'transactions',
  {
    id: identityId('id'),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    paymentMethod: paymentMethodEnum('payment_method'),
    status: transactionStatusEnum('status').notNull().default('pending'),
    referenceId: varchar('reference_id', { length: 255 }),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    index('idx_transactions_user_id').on(t.userId),
    index('idx_transactions_status').on(t.status),
    index('idx_transactions_reference_id').on(t.referenceId),
    index('idx_transactions_meta').using('gin', t.meta),
    check('ck_transactions_amount_positive', sql`${t.amount} > 0`),
    foreignKey({
      name: 'fk_transactions_user_id',
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
  ],
);

/* ---------------------------------------------------------------------------
 * projects — المشاريع
 * ------------------------------------------------------------------------- */
export const projects = pgTable(
  'projects',
  {
    id: identityId('id'),
    clientId: bigint('client_id', { mode: 'number' }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    budgetMin: numeric('budget_min', { precision: 15, scale: 2 }).notNull(),
    budgetMax: numeric('budget_max', { precision: 15, scale: 2 }).notNull(),
    durationDays: integer('duration_days').notNull(),
    status: projectStatusEnum('status').notNull().default('open'),
    ...timestamps,
  },
  (t) => [
    index('idx_projects_client_id').on(t.clientId),
    index('idx_projects_status').on(t.status),
    check('ck_projects_budget_min_non_negative', sql`${t.budgetMin} >= 0`),
    check('ck_projects_budget_max_non_negative', sql`${t.budgetMax} >= 0`),
    check('ck_projects_budget_range', sql`${t.budgetMax} >= ${t.budgetMin}`),
    check('ck_projects_duration_positive', sql`${t.durationDays} > 0`),
    foreignKey({
      name: 'fk_projects_client_id',
      columns: [t.clientId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
  ],
);

/* ---------------------------------------------------------------------------
 * proposals — عروض المستقلين
 * ------------------------------------------------------------------------- */
export const proposals = pgTable(
  'proposals',
  {
    id: identityId('id'),
    projectId: bigint('project_id', { mode: 'number' }).notNull(),
    freelancerId: bigint('freelancer_id', { mode: 'number' }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    durationDays: integer('duration_days').notNull(),
    comment: text('comment'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    ...timestamps,
  },
  (t) => [
    unique('uq_proposals_project_freelancer').on(t.projectId, t.freelancerId),
    index('idx_proposals_project_id').on(t.projectId),
    index('idx_proposals_freelancer_id').on(t.freelancerId),
    index('idx_proposals_status').on(t.status),
    check('ck_proposals_amount_positive', sql`${t.amount} > 0`),
    check('ck_proposals_duration_positive', sql`${t.durationDays} > 0`),
    check(
      'ck_proposals_status',
      sql`${t.status} IN ('pending', 'accepted', 'rejected', 'withdrawn')`,
    ),
    foreignKey({
      name: 'fk_proposals_project_id',
      columns: [t.projectId],
      foreignColumns: [projects.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'fk_proposals_freelancer_id',
      columns: [t.freelancerId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
  ],
);

/* ---------------------------------------------------------------------------
 * kyc_documents — وثائق توثيق الهوية
 * ------------------------------------------------------------------------- */
export const kycDocuments = pgTable(
  'kyc_documents',
  {
    id: identityId('id'),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    encryptedFilePath: text('encrypted_file_path').notNull(),
    frontFilePath: text('front_file_path'),
    backFilePath: text('back_file_path'),
    selfieFilePath: text('selfie_file_path'),
    rejectionReason: text('rejection_reason'),
    reviewedBy: bigint('reviewed_by', { mode: 'number' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    ...timestamps,
  },
  (t) => [
    index('idx_kyc_documents_user_id').on(t.userId),
    index('idx_kyc_documents_status').on(t.status),
    check(
      'ck_kyc_documents_document_type',
      sql`${t.documentType} IN ('national_id', 'passport', 'driver_license', 'other')`,
    ),
    check(
      'ck_kyc_documents_status',
      sql`${t.status} IN ('pending', 'approved', 'rejected')`,
    ),
    foreignKey({
      name: 'fk_kyc_documents_user_id',
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
  ],
);

/* ---------------------------------------------------------------------------
 * contracts — العقود بين العميل والمستقل (المرحلة 9 — المواصفة الدقيقة)
 * ------------------------------------------------------------------------- */
export const contracts = pgTable(
  'contracts',
  {
    id: identityId('id'),
    projectId: bigint('project_id', { mode: 'number' }).notNull(),
    clientId: bigint('client_id', { mode: 'number' }).notNull(),
    freelancerId: bigint('freelancer_id', { mode: 'number' }).notNull(),
    proposalId: bigint('proposal_id', { mode: 'number' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 4 })
      .notNull()
      .default('0.15'),
    commission: numeric('commission', { precision: 15, scale: 2 }).notNull(),
    netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    escrowLockedAt: timestamp('escrow_locked_at', { withTimezone: true }),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('idx_contracts_project_id').on(t.projectId),
    index('idx_contracts_client_id').on(t.clientId),
    index('idx_contracts_freelancer_id').on(t.freelancerId),
    index('idx_contracts_status').on(t.status),
    check('ck_contracts_amount_positive', sql`${t.amount} > 0`),
    check(
      'ck_contracts_commission_rate',
      sql`${t.commissionRate} >= 0 AND ${t.commissionRate} <= 1`,
    ),
    check('ck_contracts_net_amount_positive', sql`${t.netAmount} > 0`),
    check(
      'ck_contracts_status',
      sql`${t.status} IN ('pending', 'active', 'completed', 'disputed', 'cancelled')`,
    ),
    foreignKey({
      name: 'fk_contracts_project_id',
      columns: [t.projectId],
      foreignColumns: [projects.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_contracts_client_id',
      columns: [t.clientId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_contracts_freelancer_id',
      columns: [t.freelancerId],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_contracts_proposal_id',
      columns: [t.proposalId],
      foreignColumns: [proposals.id],
    }).onDelete('set null'),
  ],
);

/* ============================================================================
 * 3) العلاقات (Relations)
 * ========================================================================== */

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
  projects: many(projects),
  proposals: many(proposals),
  kycDocuments: many(kycDocuments),
  clientContracts: many(contracts, { relationName: 'clientContracts' }),
  freelancerContracts: many(contracts, { relationName: 'freelancerContracts' }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, {
    fields: [projects.clientId],
    references: [users.id],
  }),
  proposals: many(proposals),
  contracts: many(contracts),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id],
  }),
  freelancer: one(users, {
    fields: [proposals.freelancerId],
    references: [users.id],
  }),
  contracts: many(contracts),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  project: one(projects, {
    fields: [contracts.projectId],
    references: [projects.id],
  }),
  proposal: one(proposals, {
    fields: [contracts.proposalId],
    references: [proposals.id],
  }),
  client: one(users, {
    fields: [contracts.clientId],
    references: [users.id],
    relationName: 'clientContracts',
  }),
  freelancer: one(users, {
    fields: [contracts.freelancerId],
    references: [users.id],
    relationName: 'freelancerContracts',
  }),
}));

/* ============================================================================
 * 4) استخراج الأنواع (Type Inference)
 * ========================================================================== */

export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type TransactionStatus = (typeof transactionStatusEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type Currency = (typeof currencyEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;

export type KycDocument = typeof kycDocuments.$inferSelect;
export type NewKycDocument = typeof kycDocuments.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
