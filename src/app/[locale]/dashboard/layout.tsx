/**
 * ============================================================================
 *  mnste9 — تخطيط لوحة التحكم (/dashboard/*)
 * ============================================================================
 *  التخطيط (مواصفة المرحلة):
 *   - Grid: grid-cols-1 lg:grid-cols-[250px_1fr].
 *   - القائمة الجانبية على اليمين (RTL) — أول عنصر في DOM يقع أقصى
 *     اليمين في شبكة RTL، لذا يأتي الـ sidebar أولاً في الترتيب.
 *   - المحتوى على اليسار.
 *
 *  ملاحظات:
 *   - الحماية في middleware (إعادة توجيه غير المسجلين إلى /login مع
 *     ?from=) — لا حاجة لأي فحص هنا؛ الصفحات الداخلية تتحقق بنفسها
 *     أيضاً عبر getCurrentUser (دفاع متعدد الطبقات).
 *   - القائمة الجانبية مكوّن عميل (usePathname لإبراز الرابط النشط)
 *     في ملف مستقل sidebar.tsx؛ هذا الملف يبقى مكوّن سيرفر خفيفاً.
 *   - القاعدة الذهبية (المرحلة 8): يمرَّر دور المستخدم الحالي إلى
 *     القائمة الجانبية لتُظهر رابط «توثيق الهوية» للمستقلين فقط —
 *     أصحاب العمل لا يحتاجون KYC إطلاقاً.
 * ============================================================================
 */

import { NotificationBell } from '@/components/notifications/notification-bell';
import { getCurrentUser } from '@/lib/auth';

import { DashboardSidebar } from './sidebar';
import { getFreelancerSetupState } from './setup/setup-data';
import { isFreelancerSetupComplete } from './setup/setup-helpers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // دور الجلسة الحالية — لاختيار القائمة المناسبة لكل دور.
  const currentUser = await getCurrentUser();
  const setupComplete =
    currentUser?.role === 'freelancer'
      ? isFreelancerSetupComplete(await getFreelancerSetupState(currentUser.id))
      : true;

  return (
    <div className="flex-1 bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr]">
        {/* القائمة الجانبية — يمين الشاشة على الحواسيب، وأعلى الصفحة على الجوال */}
        <DashboardSidebar role={currentUser?.role ?? null} setupComplete={setupComplete} isKycVerified={Boolean(currentUser?.isKycVerified)} />

        {/* المحتوى — يسار القائمة على الحواسيب */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex justify-end">
            <NotificationBell />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
