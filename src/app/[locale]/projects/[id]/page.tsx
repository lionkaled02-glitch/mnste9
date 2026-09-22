/**
 * ============================================================================
 *  خدمات — صفحة تفاصيل المشروع (/projects/[id]) — إعادة تصميم 100% مستقل
 * ============================================================================
 *  - عرض كامل تفاصيل العمل، معلومات صاحب المشروع، الميزانية، مدة التنفيذ
 *  - نموذج تقديم عرض مع حساب عمولة تلقائي 15%
 *  - قسم العروض المقدمة (صاحب المشروع يراها كاملة)
 *  - Tailwind RTL Mobile First + #2386c8
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  deriveCategoryLabel,
  extractSkills,
  formatBudgetRange,
  formatDurationDays,
  formatProposalCount,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
  stripCategoryTag,
  timeAgo,
} from '@/lib/services/project-meta';
import { getProjectProposals, getProjectWithClient, hasUserProposed } from '@/lib/services/projects';
import { ProposalFormEnhanced } from '@/components/projects/ProposalFormEnhanced';
import { ProposalsList } from '@/components/projects/ProposalsList';

export const dynamic = 'force-dynamic';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

function parseProjectId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

export async function generateMetadata({ params }: ProjectDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) return { title: 'تفاصيل المشروع | خدمات' };
  const project = await getProjectWithClient(projectId);
  return {
    title: project ? `${project.title} | خدمات` : 'تفاصيل المشروع | خدمات',
    description: project ? stripCategoryTag(project.description).slice(0, 160) : undefined,
  };
}

function Notice({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'warning' }) {
  const styles = {
    default: 'border-gray-200 bg-[#f4f5f7] text-[#555]',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-[10px] border px-4 py-3 text-[13px] leading-6 ${styles[tone]}`}>
      {children}
    </div>
  );
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) notFound();

  const project = await getProjectWithClient(projectId);
  if (!project) notFound();

  const currentUser = await getCurrentUser();
  const [proposals, alreadyProposed] = await Promise.all([
    getProjectProposals(project.id),
    currentUser?.role === 'freelancer' ? hasUserProposed(project.id, currentUser.id) : Promise.resolve(false),
  ]);

  const isOwner = currentUser?.id === project.clientId;
  const categoryLabel = deriveCategoryLabel(`${project.title} ${project.description}`);
  const skills = extractSkills(`${project.title} ${project.description}`, 5);
  const cleanDesc = stripCategoryTag(project.description);
  const clientInitial = project.clientName.trim().charAt(0) || 'م';

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-[12px] text-[#888]">
            <Link href="/" className="hover:text-[#222]">الرئيسية</Link>
            <span>/</span>
            <Link href="/projects" className="hover:text-[#222]">المشاريع</Link>
            <span>/</span>
            <span className="line-clamp-1 font-medium text-[#222]">{project.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Project header card */}
            <article className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="flex-1 text-[20px] font-extrabold leading-7 text-[#222] sm:text-[22px]">{project.title}</h1>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${PROJECT_STATUS_BADGE_CLASSES[project.status as keyof typeof PROJECT_STATUS_BADGE_CLASSES]}`}
                >
                  {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categoryLabel && (
                  <span className="inline-flex items-center rounded-full bg-[#2386c8]/10 border border-[#2386c8]/15 px-3 py-1 text-[11px] font-bold text-[#2386c8]">
                    {categoryLabel}
                  </span>
                )}
                {skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="inline-flex items-center rounded-full bg-[#f4f5f7] border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-[#555]">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-4 sm:grid-cols-4">
                <div>
                  <div className="text-[11px] text-[#888]">الميزانية</div>
                  <div className="mt-1 text-[13px] font-bold text-[#222]" dir="ltr">{formatBudgetRange(project.budgetMin, project.budgetMax)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#888]">مدة التنفيذ</div>
                  <div className="mt-1 text-[13px] font-bold text-[#222]">{formatDurationDays(project.durationDays)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#888]">تاريخ النشر</div>
                  <div className="mt-1 text-[13px] font-bold text-[#222]">{timeAgo(project.createdAt)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#888]">العروض</div>
                  <div className="mt-1 text-[13px] font-bold text-[#222]">{formatProposalCount(project.proposalsCount)}</div>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <h2 className="text-[14px] font-bold text-[#222]">وصف المشروع</h2>
              <div className="mt-3 whitespace-pre-line text-[13.5px] leading-7 text-[#444]">{cleanDesc}</div>

              {/* ضمان */}
              <div className="mt-6 flex items-start gap-3 rounded-[10px] border border-[#2386c8]/15 bg-[#2386c8]/[0.04] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[12px] font-bold text-[#222]">مشروع محمي بضمان خدمات</div>
                  <p className="mt-1 text-[11px] leading-5 text-[#666]">المبلغ يبقى في ضمان خدمات حتى تسليم العمل وموافقتك. في حال عدم الالتزام، نضمن استرداد حقك المالي.</p>
                </div>
              </div>
            </article>

            {/* Proposal form */}
            <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-[15px] font-bold text-[#222]">تقديم عرض</h2>
              <p className="mt-1 text-[12px] text-[#888]">قدم عرضك المميز ووضح كيف ستنفذ المشروع باحترافية</p>

              <div className="mt-6">
                {!currentUser ? (
                  <div className="rounded-[12px] border border-dashed border-gray-300 bg-[#fcfcfc] px-6 py-10 text-center">
                    <p className="text-[13px] font-bold text-[#444]">سجل دخولك لتقديم عرض</p>
                    <p className="mt-1 text-[12px] text-[#888]">يجب أن تكون مستقلاً موثق الهوية لتقديم العروض</p>
                    <Link
                      href={`/login?from=/projects/${project.id}`}
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]"
                    >
                      تسجيل الدخول
                    </Link>
                  </div>
                ) : isOwner ? (
                  <Notice tone="warning">
                    هذا مشروعك المنشور — ستظهر عروض المستقلين أدناه. يمكنك التواصل معهم وقبول العرض المناسب من لوحة التحكم.
                    <div className="mt-3">
                      <Link href="/dashboard/projects" className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#222] px-4 text-[11px] font-bold text-white hover:bg-black">
                        إدارة مشاريعي
                      </Link>
                    </div>
                  </Notice>
                ) : project.status !== 'open' ? (
                  <Notice>هذا المشروع مغلق حالياً لتلقي العروض.</Notice>
                ) : currentUser.role !== 'freelancer' ? (
                  <Notice>تقديم العروض متاح للمستقلين فقط. يمكنك تغيير نوع حسابك من الإعدادات.</Notice>
                ) : alreadyProposed ? (
                  <Notice tone="success">
                    لقد قدّمت عرضك على هذا المشروع بالفعل. سيتم إشعارك عند رد صاحب المشروع.
                    <div className="mt-2 text-[11px]">يمكنك متابعة عروضك من لوحة التحكم.</div>
                  </Notice>
                ) : (
                  <ProposalFormEnhanced projectId={project.id} />
                )}
              </div>
            </section>

            {/* Proposals list */}
            <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#222]">العروض المقدمة ({proposals.length})</h2>
                {isOwner && proposals.length > 0 && (
                  <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-medium text-[#666]">مرئية لك فقط كصاحب مشروع</span>
                )}
              </div>

              <div className="mt-6">
                {isOwner ? (
                  <ProposalsList proposals={proposals} isOwner={true} />
                ) : (
                  <>
                    <div className="rounded-[10px] bg-[#f4f5f7] p-4 text-[12px] leading-6 text-[#666]">
                      {proposals.length === 0
                        ? 'لم يقدم أحد عرضاً بعد — كن أول من يبادر.'
                        : `يوجد ${proposals.length} عرض مقدم. صاحب المشروع فقط يرى التفاصيل الكاملة للعروض. قدم عرضك المميز لزيادة فرصك.`}
                    </div>
                    {proposals.length > 0 && (
                      <div className="mt-4">
                        <ProposalsList proposals={proposals.slice(0, 3)} isOwner={false} />
                        {proposals.length > 3 && (
                          <p className="mt-3 text-center text-[11px] text-[#888]">+ {proposals.length - 3} عروض أخرى مرئية لصاحب المشروع</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Client card */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-[#222]">عن صاحب المشروع</h3>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2386c8]/10 text-[16px] font-bold text-[#2386c8]">
                  {clientInitial}
                </span>
                <div>
                  <div className="text-[13px] font-bold text-[#222]">{project.clientName}</div>
                  <div className="text-[11px] text-[#888]">عضو منذ {new Date(project.clientCreatedAt).toLocaleDateString('ar-YE')}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] text-[#666] border border-gray-200">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  {project.clientEmail}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                    project.clientIsKycVerified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {project.clientIsKycVerified ? '✓ هوية موثقة' : 'هوية غير موثقة'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-3">
                  <div className="text-[16px] font-extrabold text-[#222]">{project.proposalsCount}</div>
                  <div className="text-[11px] text-[#888]">عرض مستلم</div>
                </div>
                <div className="rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-3">
                  <div className="text-[16px] font-extrabold text-[#222]">4.9</div>
                  <div className="text-[11px] text-[#888]">تقييم متوسط</div>
                </div>
              </div>

              <Link
                href={`/freelancers?client=${project.clientId}`}
                className="mt-5 flex h-9 w-full items-center justify-center rounded-[10px] border border-gray-200 bg-white text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]"
              >
                مشاريع أخرى لنفس العميل
              </Link>
            </div>

            {/* Budget card */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-[#222]">تفاصيل الميزانية</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#666]">الميزانية</span>
                  <span className="font-bold text-[#222]" dir="ltr">{formatBudgetRange(project.budgetMin, project.budgetMax)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#666]">مدة التنفيذ</span>
                  <span className="font-bold text-[#222]">{formatDurationDays(project.durationDays)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#666]">متوسط العروض</span>
                  <span className="font-bold text-[#222]">
                    {proposals.length > 0
                      ? `${(proposals.reduce((s, p) => s + Number.parseFloat(p.amount || '0'), 0) / proposals.length).toFixed(0)}$`
                      : '—'}
                  </span>
                </div>
                <hr className="border-gray-100" />
                <div className="rounded-[10px] bg-[#2386c8]/5 border border-[#2386c8]/10 p-3">
                  <div className="text-[11px] font-bold text-[#2386c8]">💡 نصيحة للمستقل</div>
                  <p className="mt-1 text-[11px] leading-5 text-[#555]">قدم عرضاً ضمن ميزانية العميل، ووضح قيمة مضافة. العروض المخصصة تُقبل 3x أكثر من العامة.</p>
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-[#222]">شارك المشروع</h3>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : '')}
                  className="flex-1 rounded-[8px] bg-[#f4f5f7] border border-gray-200 px-3 py-2 text-[11px] font-bold text-[#444] hover:bg-white"
                >
                  نسخ الرابط
                </button>
                <Link href="/help#guarantee" className="flex-1 rounded-[8px] bg-[#222] px-3 py-2 text-center text-[11px] font-bold text-white hover:bg-black">
                  الضمان
                </Link>
              </div>
            </div>

            {/* Similar projects */}
            <div className="rounded-[14px] border border-gray-200 bg-[#fcfcfc] p-5">
              <h3 className="text-[12px] font-bold text-[#222]">مشاريع مشابهة</h3>
              <p className="mt-2 text-[11px] leading-5 text-[#666]">تصفح مشاريع في نفس التصنيف {categoryLabel ? `(${categoryLabel})` : ''} لزيادة فرصك.</p>
              <Link
                href={categoryLabel ? `/projects?category=${encodeURIComponent(deriveCategoryLabel(`${project.title} ${project.description}`) ? 'programming' : '')}` : '/projects'}
                className="mt-3 inline-flex h-8 items-center justify-center rounded-[8px] bg-white border border-gray-200 px-4 text-[11px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]"
              >
                تصفح المشابهة
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <Link href="/projects" className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-[#555] hover:border-[#2386c8] hover:text-[#2386c8]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M21 12H3" />
            </svg>
            العودة إلى المشاريع
          </Link>
        </div>
      </div>
    </div>
  );
}
