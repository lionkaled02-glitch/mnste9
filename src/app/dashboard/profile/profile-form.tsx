'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج الملف الشخصي (مكوّن عميل)
 * ============================================================================
 *  الأقسام:
 *   1) المعلومات الأساسية: الاسم (إلزامي)، البريد (للعرض فقط — معرّف
 *      الدخول ولا يُغيَّر من هنا)، الهاتف (اختياري).
 *   2) التفضيلات: العملة المفضلة (USD أو SAR حصراً — لا YER)، المدينة.
 *   3) المعلومات المهنية — للمستقلين فقط: المهارات (مفصولة بفواصل)،
 *      النبذة، السعر بالساعة (بالدولار الأمريكي).
 *
 *  يعمل عبر Server Action (updateProfileAction) مع useActionState:
 *   - عرض أخطاء zod لكل حقل + رسالة نجاح/خطأ عامة.
 *   - isPending أثناء الإرسال (تعطيل زر «حفظ التغييرات»).
 *   - بعد النجاح: revalidatePath داخل الإجراء يعيد عرض القيم الجديدة.
 *   - النموذج يعمل حتى مع تعطيل JavaScript (Progressive Enhancement).
 * ============================================================================
 */

import { useActionState } from 'react';

import { updateProfileAction } from '@/app/actions/profile';
import type { AuthActionState } from '@/lib/auth';
import { PREFERRED_CURRENCY_OPTIONS } from '@/lib/services/user-meta';

const INITIAL_STATE: AuthActionState = { success: false };

/** صنف موحّد لحقول الإدخال (نفس نمط نماذج المشاريع والمصادقة) */
const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

/** صنف موحّد لعناوين الأقسام داخل النموذج */
const SECTION_TITLE_CLASSES = 'text-base font-bold text-slate-900';

/** القيم الابتدائية للنموذج كما هي في قاعدة البيانات */
interface ProfileFormProps {
  defaultValues: {
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    preferredCurrency: string | null;
    skills: string | null;
    bio: string | null;
    /** NUMERIC(15,2) يعود من Drizzle كنص — مثل "25.00" */
    hourlyRate: string | null;
  };
  /** المعلومات المهنية تُعرض وتُحفَظ للمستقلين فقط */
  isFreelancer: boolean;
}

export function ProfileForm({ defaultValues, isFreelancer }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    INITIAL_STATE,
  );

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const nameError = fieldError('name');
  const phoneError = fieldError('phone');
  const cityError = fieldError('city');
  const currencyError = fieldError('preferredCurrency');
  const skillsError = fieldError('skills');
  const bioError = fieldError('bio');
  const hourlyRateError = fieldError('hourlyRate');

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
    }`;

  return (
    <form action={formAction} className="space-y-10" noValidate>
      {state.message && !state.success && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}
      {state.success && state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      {/* 1) المعلومات الأساسية */}
      <fieldset className="space-y-5" disabled={isPending}>
        <legend className={SECTION_TITLE_CLASSES}>المعلومات الأساسية</legend>

        {/* الاسم */}
        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            الاسم
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={defaultValues.name}
            placeholder="اسمك الكامل كما يظهر للآخرين"
            className={inputClasses(Boolean(nameError))}
          />
          {nameError && (
            <p className="mt-1.5 text-sm text-red-600">{nameError}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* البريد — للعرض فقط (معرّف الدخول) */}
          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              البريد الإلكتروني
            </label>
            <input
              id="profile-email"
              type="email"
              dir="ltr"
              disabled
              value={defaultValues.email}
              className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-slate-50 px-4 py-2.5 text-left text-gray-500"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              لا يمكن تغيير البريد الإلكتروني — إنه معرّف الدخول إلى حسابك.
            </p>
          </div>

          {/* الهاتف */}
          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              رقم الهاتف <span className="text-slate-400">(اختياري)</span>
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              dir="ltr"
              maxLength={30}
              defaultValue={defaultValues.phone ?? ''}
              placeholder="+967 77X XXX XXX"
              className={`${inputClasses(Boolean(phoneError))} text-left`}
            />
            {phoneError ? (
              <p className="mt-1.5 text-sm text-red-600">{phoneError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                بصيغة دولية — يستخدم لإشعارات الجوال وتواصل المنصة.
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* 2) التفضيلات — العملة المفضلة والمدينة */}
      <fieldset className="space-y-5" disabled={isPending}>
        <legend className={SECTION_TITLE_CLASSES}>التفضيلات</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* العملة المفضلة — USD أو SAR حصراً */}
          <div>
            <label
              htmlFor="profile-currency"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              العملة المفضلة
            </label>
            <select
              id="profile-currency"
              name="preferredCurrency"
              defaultValue={defaultValues.preferredCurrency ?? ''}
              className={`${inputClasses(Boolean(currencyError))} bg-white`}
            >
              <option value="">غير محددة بعد</option>
              {PREFERRED_CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {currencyError ? (
              <p className="mt-1.5 text-sm text-red-600">{currencyError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                بنك الكريمي يدعم الدولار الأمريكي والريال السعودي فقط —
                الريال اليمني غير مدعوم.
              </p>
            )}
          </div>

          {/* المدينة */}
          <div>
            <label
              htmlFor="profile-city"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              المدينة <span className="text-slate-400">(اختياري)</span>
            </label>
            <input
              id="profile-city"
              name="city"
              type="text"
              maxLength={100}
              defaultValue={defaultValues.city ?? ''}
              placeholder="مثال: عدن"
              className={inputClasses(Boolean(cityError))}
            />
            {cityError && (
              <p className="mt-1.5 text-sm text-red-600">{cityError}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* 3) المعلومات المهنية — للمستقلين فقط */}
      {isFreelancer && (
        <fieldset className="space-y-5" disabled={isPending}>
          <legend className={SECTION_TITLE_CLASSES}>
            المعلومات المهنية
            <span className="ms-2 text-xs font-medium text-slate-400">
              تظهر لأصحاب العمل عند تصفح المستقلين
            </span>
          </legend>

          {/* المهارات */}
          <div>
            <label
              htmlFor="profile-skills"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              المهارات <span className="text-slate-400">(اختياري)</span>
            </label>
            <input
              id="profile-skills"
              name="skills"
              type="text"
              maxLength={500}
              defaultValue={defaultValues.skills ?? ''}
              placeholder="مثال: React، TypeScript، تصميم واجهات"
              className={inputClasses(Boolean(skillsError))}
            />
            {skillsError ? (
              <p className="mt-1.5 text-sm text-red-600">{skillsError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                افصل بين المهارات بفاصلة.
              </p>
            )}
          </div>

          {/* النبذة */}
          <div>
            <label
              htmlFor="profile-bio"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              النبذة <span className="text-slate-400">(اختياري)</span>
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={5}
              maxLength={1000}
              defaultValue={defaultValues.bio ?? ''}
              placeholder="عرّف أصحاب العمل بخبرتك وأسلوب عملك وما تقدمه لهم…"
              className={`${inputClasses(Boolean(bioError))} resize-y`}
            />
            {bioError && (
              <p className="mt-1.5 text-sm text-red-600">{bioError}</p>
            )}
          </div>

          {/* السعر بالساعة */}
          <div>
            <label
              htmlFor="profile-hourly-rate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              السعر بالساعة <span className="text-slate-400">(اختياري)</span>
            </label>
            <input
              id="profile-hourly-rate"
              name="hourlyRate"
              type="number"
              dir="ltr"
              min={0}
              step="0.01"
              defaultValue={defaultValues.hourlyRate ?? ''}
              placeholder="25.00"
              className={`${inputClasses(Boolean(hourlyRateError))} text-left`}
            />
            {hourlyRateError ? (
              <p className="mt-1.5 text-sm text-red-600">{hourlyRateError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                بالدولار الأمريكي (USD) — عملة التعاملات في المنصة.
              </p>
            )}
          </div>
        </fieldset>
      )}

      {/* زر الحفظ */}
      <div className="border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
        </button>
      </div>
    </form>
  );
}
