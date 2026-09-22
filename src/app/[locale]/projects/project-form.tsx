'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج نشر مشروع جديد — المرحلة 10 محسّن
 * ============================================================================
 *  التحسينات:
 *   - زرّان علويّان: "اختر من نموذج" / "ادخل يدوياً"
 *   - قوالب جاهزة (3 نماذج) تملأ الحقول تلقائياً.
 *   - قسم "ماذا نضمن لك" (3 نقاط) + "كيف تنشر مشروعاً ناجحاً" (3 نصائح).
 *   - زر "حفظ كمسودة" (localStorage — لا يحتاج هجرة، لأن حالة draft غير موجودة في enum).
 *   - تصميم شبكي: النموذج + الشريط الجانبي للمعلومات.
 * ============================================================================
 */

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useRef } from 'react';

import { createProjectAction } from '@/app/actions/projects';
import type { AuthActionState } from '@/lib/auth';
import { PROJECT_CATEGORIES, type ProjectCategorySlug } from '@/lib/services/project-meta';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

interface Template {
  slug: string;
  title: string;
  label: string;
  description: string;
  category: ProjectCategorySlug;
  budgetMin: string;
  budgetMax: string;
  durationDays: string;
}

const TEMPLATES: Template[] = [
  {
    slug: 'personal-website',
    title: 'تصميم موقع شخصي متكامل',
    label: 'موقع شخصي',
    description:
      'أحتاج مصمم ومطور لإنشاء موقع شخصي يعرض أعمالي وسيرتي الذاتية. المطلوب:\n- تصميم عصري ومتجاوب\n- صفحة أعمال مع معرض صور\n- نموذج تواصل\n- لوحة تحكم بسيطة\n- تحسين SEO أساسي\nالمدة المتوقعة 2-3 أسابيع. يرجى إرفاق نماذج أعمال سابقة.',
    category: 'design' as ProjectCategorySlug,
    budgetMin: '200',
    budgetMax: '500',
    durationDays: '21',
  },
  {
    slug: 'mobile-app',
    title: 'تطبيق جوال لمتجر إلكتروني',
    label: 'تطبيق جوال',
    description:
      'مطلوب تطوير تطبيق جوال (iOS و Android) لمتجر إلكتروني قائم:\n- تسجيل دخول وملف شخصي\n- تصفح منتجات وسلة مشتريات\n- دفع عبر بنك الكريمي و PayPal\n- تتبع الطلبات وإشعارات\n- لوحة تحكم للإدارة\nيفضل استخدام Flutter أو React Native. خبرة سابقة في تطبيقات التجارة الإلكترونية مطلوبة.',
    category: 'programming' as ProjectCategorySlug,
    budgetMin: '800',
    budgetMax: '1500',
    durationDays: '45',
  },
  {
    slug: 'content-writing',
    title: 'كتابة محتوى تسويقي لموقع شركة',
    label: 'كتابة محتوى',
    description:
      'نبحث عن كاتب محتوى محترف لكتابة محتوى موقع شركة تقنية:\n- 10 صفحات (الرئيسية، من نحن، الخدمات، إلخ)\n- محتوى متوافق مع SEO\n- لغة عربية فصحى بأسلوب تسويقي جذاب\n- تسليم بملف Word + اقتراح عناوين SEO\nيشترط إرفاق نماذج كتابية سابقة.',
    category: 'writing' as ProjectCategorySlug,
    budgetMin: '100',
    budgetMax: '300',
    durationDays: '14',
  },
];

export function ProjectForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProjectAction, INITIAL_STATE);

  // وضع الإدخال: 'manual' أو 'template'
  const [mode, setMode] = useState<'manual' | 'template'>('manual');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // refs للحقول للتحكم في القيم عند اختيار قالب
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success && state.redirectTo) {
      localStorage.removeItem('mnste9_project_draft');
      router.push(state.redirectTo);
    }
  }, [state, router]);

  // تحميل مسودة من localStorage عند البداية
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mnste9_project_draft');
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Record<string, string>>;
        if (titleRef.current && draft.title) titleRef.current.value = draft.title;
        if (descRef.current && draft.description) descRef.current.value = draft.description;
        if (categoryRef.current && draft.category) categoryRef.current.value = draft.category;
        if (minRef.current && draft.budgetMin) minRef.current.value = draft.budgetMin;
        if (maxRef.current && draft.budgetMax) maxRef.current.value = draft.budgetMax;
        if (durationRef.current && draft.durationDays) durationRef.current.value = draft.durationDays;
      }
    } catch {
      // تجاهل أخطاء القراءة
    }
  }, []);

  const applyTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setMode('manual'); // الانتقال للوضع اليدوي بعد اختيار القالب
    if (titleRef.current) titleRef.current.value = tpl.title;
    if (descRef.current) descRef.current.value = tpl.description;
    if (categoryRef.current) categoryRef.current.value = tpl.category;
    if (minRef.current) minRef.current.value = tpl.budgetMin;
    if (maxRef.current) maxRef.current.value = tpl.budgetMax;
    if (durationRef.current) durationRef.current.value = tpl.durationDays;
  };

  const handleSaveDraft = () => {
    const draft = {
      title: titleRef.current?.value || '',
      description: descRef.current?.value || '',
      category: categoryRef.current?.value || '',
      budgetMin: minRef.current?.value || '',
      budgetMax: maxRef.current?.value || '',
      durationDays: durationRef.current?.value || '',
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('mnste9_project_draft', JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      // مساحة التخزين ممتلئة
    }
  };

  const titleError = state.fieldErrors?.title?.[0];
  const descriptionError = state.fieldErrors?.description?.[0];
  const categoryError = state.fieldErrors?.category?.[0];
  const budgetMinError = state.fieldErrors?.budgetMin?.[0];
  const budgetMaxError = state.fieldErrors?.budgetMax?.[0];
  const durationError = state.fieldErrors?.durationDays?.[0];

  const inputCls = (hasError?: boolean) =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* العمود الرئيسي — النموذج */}
      <div className="lg:col-span-2">
        {/* أزرار اختيار الوضع */}
        <div className="mb-4 flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === 'template'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            📋 اختر من نموذج
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === 'manual'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            ✍️ ادخل يدوياً
          </button>
        </div>

        {/* عرض القوالب عند اختيار وضع القالب */}
        {mode === 'template' && (
          <div className="mb-6 grid gap-3">
            <p className="text-sm font-medium text-slate-700">اختر قالباً جاهزاً لتعبئة النموذج تلقائياً:</p>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.slug}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`rounded-xl border p-4 text-right transition ${
                  selectedTemplate?.slug === tpl.slug
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{tpl.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">{tpl.description.slice(0, 120)}…</p>
                    <div className="mt-2 flex gap-2 text-[11px]">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{tpl.label}</span>
                      <span dir="ltr" className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                        ${tpl.budgetMin} - ${tpl.budgetMax}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{tpl.durationDays} يوم</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedTemplate?.slug === tpl.slug ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedTemplate?.slug === tpl.slug ? 'تم الاختيار ✓' : 'اختيار'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
          {state.message && !state.success && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
          )}

          {draftSaved && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              تم حفظ المسودة محلياً — يمكنك العودة إليها لاحقاً من نفس المتصفح.
            </p>
          )}

          {/* العنوان */}
          <div>
            <label htmlFor="project-title" className="mb-2 block text-sm font-medium text-gray-700">
              عنوان المشروع
            </label>
            <input
              ref={titleRef}
              id="project-title"
              name="title"
              type="text"
              required
              maxLength={255}
              placeholder="مثال: تطوير متجر إلكتروني متكامل"
              className={`${inputCls(Boolean(titleError))}`}
            />
            {titleError && <p className="mt-1.5 text-sm text-red-600">{titleError}</p>}
          </div>

          {/* الوصف */}
          <div>
            <label htmlFor="project-description" className="mb-2 block text-sm font-medium text-gray-700">
              وصف المشروع
            </label>
            <textarea
              ref={descRef}
              id="project-description"
              name="description"
              rows={7}
              required
              maxLength={5000}
              placeholder="اشرح متطلبات المشروع والمهارات المطلوبة ومعايير الإنجاز…"
              className={`${inputCls(Boolean(descriptionError))} resize-y`}
            />
            {descriptionError && <p className="mt-1.5 text-sm text-red-600">{descriptionError}</p>}
          </div>

          {/* التصنيف */}
          <div>
            <label htmlFor="project-category" className="mb-2 block text-sm font-medium text-gray-700">
              التصنيف
            </label>
            <select
              ref={categoryRef}
              id="project-category"
              name="category"
              required
              defaultValue=""
              className={`${inputCls(Boolean(categoryError))} bg-white`}
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
            {categoryError && <p className="mt-1.5 text-sm text-red-600">{categoryError}</p>}
          </div>

          {/* الميزانية والمدة */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="project-budget-min" className="mb-2 block text-sm font-medium text-gray-700">
                الميزانية الدنيا <span className="text-gray-400">($)</span>
              </label>
              <input
                ref={minRef}
                id="project-budget-min"
                name="budgetMin"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                placeholder="100"
                dir="ltr"
                className={`${inputCls(Boolean(budgetMinError))} text-left`}
              />
              {budgetMinError && <p className="mt-1.5 text-sm text-red-600">{budgetMinError}</p>}
            </div>

            <div>
              <label htmlFor="project-budget-max" className="mb-2 block text-sm font-medium text-gray-700">
                الميزانية القصوى <span className="text-gray-400">($)</span>
              </label>
              <input
                ref={maxRef}
                id="project-budget-max"
                name="budgetMax"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                placeholder="500"
                dir="ltr"
                className={`${inputCls(Boolean(budgetMaxError))} text-left`}
              />
              {budgetMaxError && <p className="mt-1.5 text-sm text-red-600">{budgetMaxError}</p>}
            </div>

            <div>
              <label htmlFor="project-duration" className="mb-2 block text-sm font-medium text-gray-700">
                المدة <span className="text-gray-400">(بالأيام)</span>
              </label>
              <input
                ref={durationRef}
                id="project-duration"
                name="durationDays"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                placeholder="30"
                dir="ltr"
                className={`${inputCls(Boolean(durationError))} text-left`}
              />
              {durationError && <p className="mt-1.5 text-sm text-red-600">{durationError}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'جارٍ النشر…' : 'نشر المشروع'}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              💾 حفظ كمسودة
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            سيظهر مشروعك للمستقلين فور نشره — العروض تصل إلى لوحة التحكم. المسودة تُحفظ محلياً في متصفحك فقط.
          </p>
        </form>
      </div>

      {/* الشريط الجانبي — الضمانات والنصائح */}
      <div className="space-y-6">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
            ماذا نضمن لك
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-emerald-900/80">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>حصولك على العمل بالجودة التي وعدت بها.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>تنفيذ المشروع ضمن الوقت المحدد.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>نجاح تنفيذ المشروع أو نعيد لك ما دفعت.</span>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">💡</span>
            كيف تنشر مشروعاً ناجحاً
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li className="flex gap-2.5">
              <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-slate-100 text-center text-xs font-bold text-slate-600">1</span>
              <span>
                <span className="font-semibold text-slate-800">كن محدداً:</span> اذكر المخرجات المطلوبة، التقنيات، ومعايير القبول بوضوح — كلما كان الوصف أدق، كانت العروض أفضل.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-slate-100 text-center text-xs font-bold text-slate-600">2</span>
              <span>
                <span className="font-semibold text-slate-800">حدد ميزانية واقعية:</span> راجع أسعار السوق — الميزانية الجيدة تجذب محترفين ولا تضيع وقتك في عروض ضعيفة.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-slate-100 text-center text-xs font-bold text-slate-600">3</span>
              <span>
                <span className="font-semibold text-slate-800">تفاعل سريعاً:</span> رد على استفسارات المستقلين في أول 24 ساعة — المشاريع النشطة تحصل على عروض أكثر بـ 3 مرات.
              </span>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-xs font-bold text-slate-700">طرق الدفع المدعومة</h4>
          <div className="mt-3 flex gap-2">
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">بنك الكريمي</span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">PayPal</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            بنك الكريمي يدعم USD و SAR فقط. لا يدعم YER — جميع المبالغ بالدولار افتراضياً.
          </p>
        </section>
      </div>
    </div>
  );
}
