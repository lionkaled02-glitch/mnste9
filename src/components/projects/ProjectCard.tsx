/**
 * خدمات — بطاقة مشروع بأسلوب مستقل 100%
 * - عنوان + ميزانية + وقت + مهارات Badges + نبذة + حالة عروض
 * - Tailwind + RTL + responsive
 */

import { Link } from '@/i18n/navigation';
import type { ProjectListItem } from '@/lib/services/projects';
import {
  formatBudgetRange,
  formatProposalCount,
  deriveCategoryLabel,
  extractSkills,
  stripCategoryTag,
  timeAgo,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_CLASSES,
} from '@/lib/services/project-meta';

interface Props {
  project: ProjectListItem;
}

export function ProjectCard({ project }: Props) {
  const categoryLabel = deriveCategoryLabel(`${project.title} ${project.description}`);
  const skills = extractSkills(`${project.title} ${project.description}`, 3);
  const cleanDesc = stripCategoryTag(project.description);

  return (
    <article className="group relative flex flex-col rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#2386c8]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-1 flex-1 text-[14.5px] font-bold leading-6 text-[#222] group-hover:text-[#2386c8]">
          <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${PROJECT_STATUS_BADGE_CLASSES[project.status as keyof typeof PROJECT_STATUS_BADGE_CLASSES] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}
        >
          {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
        </span>
      </div>

      {/* Meta: time + proposals */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#888]">
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {timeAgo(project.createdAt)}
        </span>
        <span className="h-3 w-px bg-gray-200" />
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.25h-.75V6.75A2.25 2.25 0 0 0 17.25 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v1.5h-.75A2.25 2.25 0 0 0 1.5 8.25v7.5A2.25 2.25 0 0 0 3.75 18h16.5A2.25 2.25 0 0 0 22.5 15.75v-7.5A2.25 2.25 0 0 0 20.25 8.25Z" />
          </svg>
          {formatProposalCount(project.proposalsCount)}
        </span>
        <span className="h-3 w-px bg-gray-200" />
        <span>{project.clientName}</span>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#555]">{cleanDesc}</p>

      {/* Skills Badges */}
      {(skills.length > 0 || categoryLabel) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categoryLabel && (
            <span className="inline-flex items-center rounded-full bg-[#2386c8]/10 px-2.5 py-1 text-[11px] font-medium text-[#2386c8] border border-[#2386c8]/15">
              {categoryLabel}
            </span>
          )}
          {skills
            .filter((s) => s !== categoryLabel)
            .slice(0, 3)
            .map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-medium text-[#666] border border-gray-200"
              >
                {skill}
              </span>
            ))}
        </div>
      )}

      {/* Footer: budget + duration + CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#888]">الميزانية</span>
          <span className="mt-0.5 text-[13px] font-bold text-[#222]" dir="ltr">
            {formatBudgetRange(project.budgetMin, project.budgetMax)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] text-[#666]">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {project.durationDays} يوم
          </span>
          <Link
            href={`/projects/${project.id}`}
            className="relative z-10 inline-flex h-8 items-center justify-center rounded-[8px] bg-[#2386c8] px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8]"
          >
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}
