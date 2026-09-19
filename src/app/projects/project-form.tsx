'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج نشر مشروع جديد (/projects/new — لأصحاب العمل)
 * ============================================================================
 *  الحقول: العنوان، الوصف، التصنيف، الميزانية الدنيا، الميزانية القصوى،
 *  المدة (أيام).
 *  يعمل عبر Server Action (createProjectAction) مباشرة مع:
 *   - عرض أخطاء zod لكل حقل + رسالة عامة (فحص "القصوى ≥ الدنيا" يتم
 *     داخل الإجراء نفسه — zod refine — فلا حاجة لغلاف على العميل).
 *   - isPending أثناء الإرسال (تعطيل الزر).
 *   - بعد النجاح: توجيه إلى صفحة المشروع المنشور (state.redirectTo).
 *   - النموذج يعمل حتى مع تعطيل JavaScript (Progressive Enhancement)
 *     لأن action هو إجراء خادم مباشر.
 * ============================================================================
 */

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { createProjectAction } from '@/app/actions/projects';
import type { AuthActionState } from '@/lib/auth';
import { PROJECT_CATEGORIES } from '@/lib/services/project-meta';

const INITIAL_STATE: AuthActionState = { success: false };

/** صنف موحّد لحقول الإدخال (نفس نمط صفحات المصادقة) */
const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

export function ProjectForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const titleError = state.fieldErrors?.title?.[0];
  const descriptionError = state.fieldErrors?.description?.[0];
  const categoryError = state.fieldErrors?.category?.[0];
  const budgetMinError = state.fieldErrors?.budgetMin?.[0];
  const budgetMaxError = state.fieldErrors?.budgetMax?.[0];
  const durationError = state.fieldErrors?.durationDays?.[0];

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      {state.message && !state.success && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/* العنوان */}
      <div>
        <label
          htmlFor="project-title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          عنوان المشروع
        </label>
        <input
          id="project-title"
          name="title"
          type="text"
          required
          maxLength={255}
          placeholder="مثال: تطوير متجر إلكتروني متكامل"
          className={`${INPUT_CLASSES} ${
            titleError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
        />
        {titleError && <p className="mt-1.5 text-sm text-red-600">{titleError}</p>}
      </div>

      {/* الوصف */}
      <div>
        <label
          htmlFor="project-description"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          وصف المشروع
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={6}
          required
          maxLength={5000}
          placeholder="اشرح متطلبات المشروع والمهارات المطلوبة ومعايير الإنجاز…"
          className={`${INPUT_CLASSES} resize-y ${
            descriptionError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
        />
        {descriptionError && (
          <p className="mt-1.5 text-sm text-red-600">{descriptionError}</p>
        )}
      </div>

      {/* التصنيف */}
      <div>
        <label
          htmlFor="project-category"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          التصنيف
        </label>
        <select
          id="project-category"
          name="category"
          required
          defaultValue=""
          className={`${INPUT_CLASSES} ${
            categoryError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-200'
          }`}
        >
          <option value="" disabled>
            اختر التصنيف المناسب
          </option>
          {PROJECT_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
        {categoryError && (
          <p className="mt-1.5 text-sm text-red-600">{categoryError}</p>
        )}
      </div>

      {/* الميزانية والمدة */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label
            htmlFor="project-budget-min"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            الميزانية الدنيا <span className="text-gray-400">($)</span>
          </label>
          <input
            id="project-budget-min"
            name="budgetMin"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            placeholder="100"
            dir="ltr"
            className={`${INPUT_CLASSES} text-left ${
              budgetMinError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {budgetMinError && (
            <p className="mt-1.5 text-sm text-red-600">{budgetMinError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="project-budget-max"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            الميزانية القصوى <span className="text-gray-400">($)</span>
          </label>
          <input
            id="project-budget-max"
            name="budgetMax"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            placeholder="500"
            dir="ltr"
            className={`${INPUT_CLASSES} text-left ${
              budgetMaxError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {budgetMaxError && (
            <p className="mt-1.5 text-sm text-red-600">{budgetMaxError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="project-duration"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            المدة <span className="text-gray-400">(بالأيام)</span>
          </label>
          <input
            id="project-duration"
            name="durationDays"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            placeholder="30"
            dir="ltr"
            className={`${INPUT_CLASSES} text-left ${
              durationError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {durationError && (
            <p className="mt-1.5 text-sm text-red-600">{durationError}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ النشر…' : 'نشر المشروع'}
      </button>

      <p className="text-center text-xs text-gray-400">
        سيظهر مشروعك للمستقلين فور نشره — العروض تصل إلى لوحة التحكم.
      </p>
    </form>
  );
}
