'use client';

/**
 * خدمات — نموذج ملف المستقل — رفع صورة شخصية + #2386c8
 * - الصورة الشخصية تُرفع من الجهاز (AvatarUpload) بدل إدخال رابط:
 *   المسار المرفوع يصل في الحقل المخفي avatarUrl ويُحفظ مع «حفظ التغييرات».
 */

import { useActionState, useState, useMemo } from 'react';

import { updateProfileAction } from '@/app/actions/profile';
import type { AuthActionState } from '@/lib/auth';
import { PREFERRED_CURRENCY_OPTIONS } from '@/lib/services/user-meta';

import { AvatarUpload } from './avatar-upload';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

const SECTION_TITLE_CLASSES = 'text-base font-bold text-slate-900';

const SUGGESTED_SKILLS = [
  'تصميم واجهات',
  'برمجة ويب',
  'كتابة محتوى',
  'ترجمة',
  'تطوير تطبيقات',
  'تسويق رقمي',
  'تحليل بيانات',
  'مونتاج فيديو',
  'تصميم جرافيك',
  'إدارة مشاريع',
  'React',
  'Next.js',
];

function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface ProfileFormProps {
  defaultValues: {
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    preferredCurrency: string | null;
    skills: string | null;
    bio: string | null;
    hourlyRate: string | null;
    avatarUrl: string | null;
  };
}

export function FreelancerProfileForm({ defaultValues }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, INITIAL_STATE);

  const [skills, setSkills] = useState<string[]>(() => parseSkills(defaultValues.skills));
  const [newSkill, setNewSkill] = useState('');

  const skillsString = useMemo(() => skills.join(', '), [skills]);

  const addSkill = (raw?: string) => {
    const value = (raw ?? newSkill).trim();
    if (!value) return;
    if (skills.includes(value)) {
      setNewSkill('');
      return;
    }
    if (value.length > 50) return;
    setSkills((prev) => [...prev, value]);
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const fieldError = (field: string): string | undefined => state.fieldErrors?.[field]?.[0];

  const nameError = fieldError('name');
  const phoneError = fieldError('phone');
  const cityError = fieldError('city');
  const currencyError = fieldError('preferredCurrency');
  const skillsError = fieldError('skills');
  const bioError = fieldError('bio');
  const hourlyRateError = fieldError('hourlyRate');
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
            {cityError && <p className="mt-1.5 text-sm text-red-600">{cityError}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-6" disabled={isPending}>
        <legend className={SECTION_TITLE_CLASSES}>
          المهارات والاهتمامات
          <span className="ms-2 text-xs font-medium text-slate-400">اختيارية — تساعدنا على تخصيص تجربتك</span>
        </legend>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            المهارات <span className="text-slate-400">(اختياري)</span>
          </label>

          <input type="hidden" name="skills" value={skillsString} />

          {skills.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2386c8]/20 bg-[#2386c8]/10 px-3 py-1 text-sm font-medium text-[#2386c8]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="rounded-full p-0.5 text-[#2386c8] transition hover:bg-[#2386c8]/20"
                    aria-label={`حذف ${skill}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              لم تضف أي مهارات أو اهتمامات بعد — يمكنك إضافتها الآن.
            </p>
          )}

          <div className="flex gap-2">
            <input
              id="profile-skills-input"
              type="text"
              maxLength={50}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="أدخل مهارة واضغط Enter أو إضافة"
              className={inputClasses(Boolean(skillsError))}
            />
            <button
              type="button"
              onClick={() => addSkill()}
              className="shrink-0 rounded-lg border border-[#2386c8]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#2386c8] transition hover:bg-[#2386c8]/10"
            >
              إضافة
            </button>
          </div>
          {skillsError ? (
            <p className="mt-1.5 text-sm text-red-600">{skillsError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">اضغط Enter أو زر إضافة. افصل كل مهارة على حدة.</p>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-600">مهارات مقترحة:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.map((suggested) => {
                const alreadyAdded = skills.includes(suggested);
                return (
                  <button
                    key={suggested}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => addSkill(suggested)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      alreadyAdded
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#2386c8]/30 hover:bg-[#2386c8]/10 hover:text-[#2386c8]'
                    }`}
                  >
                    {alreadyAdded ? `${suggested} ✓` : `+ ${suggested}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <fieldset className="space-y-5 rounded-xl border border-[#2386c8]/10 bg-[#2386c8]/[0.03] p-4">
          <legend className="px-2 text-sm font-bold text-[#2386c8]">بيانات المستقل</legend>
          <div>
            <label htmlFor="profile-bio" className="mb-2 block text-sm font-medium text-gray-700">
              النبذة <span className="text-slate-400">(اختياري)</span>
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={5}
              maxLength={1000}
              defaultValue={defaultValues.bio ?? ''}
              placeholder="عرّف العملاء بخبرتك وأسلوب عملك وما تقدمه…"
              className={`${inputClasses(Boolean(bioError))} resize-y bg-white`}
            />
            {bioError && <p className="mt-1.5 text-sm text-red-600">{bioError}</p>}
          </div>
        </fieldset>

        <fieldset className="space-y-5 rounded-xl border border-[#2386c8]/10 bg-[#2386c8]/[0.03] p-4">
          <legend className="px-2 text-sm font-bold text-[#2386c8]">التسعير</legend>
          <div>
            <label htmlFor="profile-hourly-rate" className="mb-2 block text-sm font-medium text-gray-700">
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
              className={`${inputClasses(Boolean(hourlyRateError))} bg-white text-left`}
            />
            {hourlyRateError ? (
              <p className="mt-1.5 text-sm text-red-600">{hourlyRateError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">بالدولار الأمريكي (USD) — عملة التعاملات في المنصة.</p>
            )}
          </div>
        </fieldset>
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
