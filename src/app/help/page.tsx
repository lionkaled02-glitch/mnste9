/**
 * ============================================================================
 *  mnste9 — مركز المساعدة (/help) — المرحلة 10
 * ============================================================================
 *  تصنيفات: للمستقلين | لأصحاب العمل | عام
 *  5 مقالات على الأقل مع محتوى مفيد.
 *  تصميم بسيط RTL — Tailwind فقط — مع SiteHeader/Footer.
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'مركز المساعدة',
};

interface Article {
  id: string;
  category: 'freelancers' | 'clients' | 'general';
  title: string;
  excerpt: string;
  content: string[];
}

const CATEGORIES = [
  { key: 'all', label: 'الكل' },
  { key: 'freelancers', label: 'للمستقلين' },
  { key: 'clients', label: 'لأصحاب العمل' },
  { key: 'general', label: 'عام' },
] as const;

const ARTICLES: Article[] = [
  {
    id: 'how-to-start-freelancer',
    category: 'freelancers',
    title: 'كيف أبدأ كمستقل على mnste9؟',
    excerpt: 'دليل سريع لإنشاء حساب مستقل، توثيق الهوية، وإضافة مهاراتك.',
    content: [
      '1. أنشئ حساباً واختر "مستقل" كنوع الحساب.',
      '2. أكمل خطوات إكمال الحساب: تأكيد رقم الجوال، إضافة المهارات، وتوثيق الهوية (KYC) — التوثيق إلزامي قبل تقديم أي عرض.',
      '3. أضف نبذة احترافية وسعراً بالساعة واقعياً (بالدولار الأمريكي).',
      '4. تصفح المشاريع المفتوحة وقدّم عروضاً مخصصة تشرح كيف ستحل مشكلة العميل، وليس مجرد نسخ عام.',
      '5. عند قبول عرضك، يُحجز المبلغ في الضمان — نفّذ العمل وسلّمه عبر المنصة لضمان حقك.',
    ],
  },
  {
    id: 'kyc-guide',
    category: 'freelancers',
    title: 'ما هو توثيق الهوية (KYC) ولماذا هو إلزامي للمستقلين؟',
    excerpt: 'KYC يحمي المنصة من الحسابات الوهمية ويزيد ثقة أصحاب العمل.',
    content: [
      'KYC يعني "اعرف عميلك" — ترفع وثيقة هوية (بطاقة، جواز، أو رخصة) مع صورة أمامية وخلفية وصورة سيلفي.',
      'الهدف: منع الاحتيال وضمان أن كل مستقل شخص حقيقي مسؤول عن عمله.',
      'المراجعة تتم خلال 24-48 ساعة. عند الموافقة تحصل على شارة "موثّق" وتظهر بجانب اسمك.',
      'أصحاب العمل لا يحتاجون KYC لتقديم المشاريع، لكن المستقلين لا يمكنهم تقديم عروض بدونه.',
      'بياناتك مشفرة ومحمية — لا تُشارك مع أي طرف ثالث.',
    ],
  },
  {
    id: 'how-to-post-project',
    category: 'clients',
    title: 'كيف أنشر مشروعاً ناجحاً يجذب أفضل العروض؟',
    excerpt: '3 نصائح ذهبية لكتابة وصف مشروع يجذب محترفين.',
    content: [
      'كن محدداً: اذكر المخرجات المطلوبة، التقنيات المفضلة، ومعايير القبول. مثال: "مطلوب موقع WordPress متجاوب مع 5 صفحات ونموذج تواصل".',
      'حدد ميزانية واقعية: راجع مشاريع مشابهة. ميزانية منخفضة جداً تجذب مبتدئين فقط، ومرتفعة جداً قد تضيع.',
      'تفاعل سريعاً: رد على استفسارات المستقلين خلال 24 ساعة — المشاريع النشطة تحصل على 3 أضعاف العروض.',
      'استخدم القوالب الجاهزة في صفحة "مشروع جديد" لتوفير الوقت.',
      'بعد النشر، راجع العروض في لوحة التحكم واختر بناءً على التقييم والخبرة وليس السعر فقط.',
    ],
  },
  {
    id: 'escrow-explained',
    category: 'clients',
    title: 'كيف يعمل الضمان المالي (Escrow)؟',
    excerpt: 'أموالك محمية حتى تستلم العمل — شرح مبسط.',
    content: [
      'عند قبول عرض مستقل، تُنشئ المنصة عقداً ويُحجز مبلغ المشروع من محفظتك في حساب الضمان.',
      'المستقل يبدأ العمل وهو مطمئن أن المبلغ محجوز، وأنت مطمئن أنه لن يُدفع إلا بموافقتك.',
      'عند التسليم، تراجع العمل وتضغط "تأكيد التسليم" — يُحرر المبلغ للمستقل بعد خصم عمولة المنصة 15%.',
      'في حال النزاع، يتدخل فريق الدعم كوسيط ويحل الخلاف بناءً على وصف المشروع والرسائل والتسليمات.',
      'طرق الدفع: بنك الكريمي (USD/SAR فقط) و PayPal — لا ندعم الريال اليمني حالياً.',
    ],
  },
  {
    id: 'general-fees',
    category: 'general',
    title: 'ما هي عمولة المنصة وطرق الدفع المتاحة؟',
    excerpt: 'عمولة ثابتة 15%، ودفع عبر بنك الكريمي و PayPal.',
    content: [
      'عمولة المنصة 15% ثابتة تُخصم من مبلغ العقد عند التحرير — المستقل يستلم 85% صافي.',
      'مثال: عقد بـ 100$ — العمولة 15$، صافي المستقل 85$.',
      'طرق الإيداع والسحب: بنك الكريمي (حوالات محلية) يدعم USD و SAR فقط، و PayPal دولي.',
      'لا يوجد حد أدنى للإيداع، لكن السحب يتطلب رصيداً متاحاً بعد خصم المحجوز في الضمان.',
      'جميع المعاملات بالدولار الأمريكي افتراضياً لتوحيد التسعير، مع عرض اختياري بالريال السعودي.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">مركز المساعدة</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            إجابات سريعة على أكثر الأسئلة شيوعاً — اختر تصنيفك وابدأ القراءة.
          </p>
        </div>

        {/* التصنيفات */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={cat.key === 'all' ? '/help' : `/help#${cat.key}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                cat.key === 'all'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* قائمة المقالات — عامودين على الشاشات الكبيرة */}
        <div className="grid gap-6 md:grid-cols-2">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              id={article.category}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    article.category === 'freelancers'
                      ? 'bg-emerald-100 text-emerald-800'
                      : article.category === 'clients'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {article.category === 'freelancers'
                    ? 'للمستقلين'
                    : article.category === 'clients'
                      ? 'لأصحاب العمل'
                      : 'عام'}
                </span>
                <span className="text-[11px] text-slate-400">#{article.id}</span>
              </div>

              <h2 className="text-base font-bold text-slate-900">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{article.excerpt}</p>

              <ul className="mt-4 space-y-2">
                {article.content.map((line, idx) => (
                  <li key={idx} className="flex gap-2 text-sm leading-7 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2">
                <Link
                  href="/register"
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  ابدأ الآن
                </Link>
                <Link
                  href="/about"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  اعرف المزيد
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* قسم تواصل سريع */}
        <section className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <h3 className="text-base font-bold text-emerald-900">لم تجد إجابتك؟</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-emerald-800/80">
            راسلنا على support@mnste9.com أو عبر لوحة التحكم — نرد خلال 24 ساعة.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              لوحة التحكم
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              العودة للرئيسية
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
