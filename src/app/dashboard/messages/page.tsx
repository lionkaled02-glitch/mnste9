/**
 * ============================================================================
 *  mnste9 — الرسائل (/dashboard/messages)
 * ============================================================================
 *  تخطيط مقسوم (Split View — مواصفة المرحلة):
 *   - يمين الشاشة: قائمة المحادثات (أول عنصر في DOM داخل شبكة RTL).
 *   - يسار الشاشة: نافذة الدردشة.
 *   - حالة الفراغ: «اختر محادثة للبدء» في نافذة الدردشة.
 *
 *  قرار موثّق — هيكل واجهة جاهز لنظام مراسلة قادم:
 *   لا يوجد جدول محادثات/رسائل في المخطط الحالي (المخطط مجمَّد ولا
 *   يُعدَّل في هذه المرحلة)، لذا تُبنى البنية الكاملة الآن: قائمة
 *   المحادثات بحالة فراغها + نافذة الدردشة بحالة «اختر محادثة للبدء» —
 *   كي لا تتغير البنية عند إضافة الجداول في مرحلة قادمة (نفس منهج
 *   قسم الإشعارات في المرحلة الخامسة).
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'الرسائل',
};

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى رسائلك.
        </p>
        <Link
          href="/login?from=/dashboard/messages"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          الرسائل
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          تواصل مع أصحاب المشاريع والمستقلين في مكان واحد
        </p>
      </div>

      {/* التخطيط المقسوم — المحادثات يميناً والدردشة يساراً (RTL) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* قائمة المحادثات — العمود الأيمن */}
        <aside className="order-1 flex max-h-[560px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">المحادثات</h2>
          </div>

          {/* حالة الفراغ — لا محادثات بعد (نظام المراسلة قادم) */}
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                />
              </svg>
            </span>
            <p className="mt-3 text-sm font-medium text-slate-600">
              لا توجد محادثات
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-400">
              ابدأ محادثة من صفحة مشروع أو ملف مستقل.
            </p>
          </div>
        </aside>

        {/* نافذة الدردشة — العمود الأيسر */}
        <section className="order-2 flex max-h-[560px] min-h-[360px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* شريط الدردشة */}
          <div className="flex h-14 items-center border-b border-slate-100 px-5">
            <h2 className="text-sm font-bold text-slate-400">الدردشة</h2>
          </div>

          {/* حالة الفراغ — لا محادثة مختارة */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                />
              </svg>
            </span>
            <p className="mt-4 text-lg font-bold text-slate-700">
              اختر محادثة للبدء
            </p>
            <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
              ستظهر رسائلك مع الطرف الآخر هنا — نظام المراسلة الفعلي
              يُفعَّل في مرحلة قادمة.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
