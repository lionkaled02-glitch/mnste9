'use client';

/**
 * خدمات — نموذج ملف صاحب العمل فقط
 */

import { useActionState } from 'react';

import { updateProfileAction } from '@/app/actions/profile';
import type { AuthActionState } from '@/lib/auth';
import { PREFERRED_CURRENCY_OPTIONS } from '@/lib/services/user-meta';

import { AvatarUpload } from './avatar-upload';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';
const SECTION_TITLE_CLASSES = 'text-base font-bold text-slate-900';

interface ClientProfileFormProps {
  defaultValues: {
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    preferredCurrency: string | null;
    avatarUrl: string | null;
  };
}

export function ClientProfileForm({ defaultValues }: ClientProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, INITIAL_STATE);

  const fieldError = (field: string): string | undefined => state.fieldErrors?.[field]?.[0];
  const nameError = fieldError('name');
  const phoneError = fieldError('phone');
  const cityError = fieldError('city');
  const currencyError = fieldError('preferredCurrency');
  const avatarUrlError = fieldError('avatarUrl');

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
    }`;

  return (
    <form action={formAction} className="space-y-10" noValidate>
      {state.message && !state.success && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
      )}
      {state.success && state.message && (
        <p className="rounded-lg border border-[#2386c8]/20 bg-[#2386c8]/10 px-4 py-3 text-sm text-[#2386c8]">{state.message}</p>
      )}

      <fieldset className="space-y-5" disabled={isPending}>
        <legend className={SECTION_TITLE_CLASSES}>المعلومات الأساسية</legend>

        <AvatarUpload
          initialUrl={defaultValues.avatarUrl}
          displayName={defaultValues.name}
          serverError={avatarUrlError}
          disabled={isPending}
        />

        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700">
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
          {nameError && <p className="mt-1.5 text-sm text-red-600">{nameError}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700">
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
            <p className="mt-1.5 text-xs text-slate-400">لا يمكن تغيير البريد الإلكتروني — إنه معرّف الدخول إلى حسابك.</p>
          </div>

          <div>
            <label htmlFor="profile-phone" className="mb-2 block text-sm font-medium text-gray-700">
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
              <p className="mt-1.5 text-xs text-slate-400">بصيغة دولية — يستخدم لإشعارات الجوال وتواصل المنصة.</p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5" disabled={isPending}>
        <legend className={SECTION_TITLE_CLASSES}>التفضيلات</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-currency" className="mb-2 block text-sm font-medium text-gray-700">
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
              <p className="mt-1.5 text-xs text-slate-400">بنك الكريمي يدعم الدولار الأمريكي والريال السعودي فقط — الريال اليمني غير مدعوم.</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-city" className="mb-2 block text-sm font-medium text-gray-700">
              المدينة / المنطقة <span className="text-slate-400">(اختياري)</span>
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
            {cityError && <p className="mt-1.5 text-sm text-red-600">{cityError}</p>}
          </div>
        </div>
      </fieldset>

      <div className="border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#2386c8] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
        </button>
      </div>
    </form>
  );
}
