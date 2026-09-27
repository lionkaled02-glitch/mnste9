import type { MetadataRoute } from 'next';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { projects, users } from '@/db/schema';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://khadamat.com';
const now = () => new Date();

function localized(path: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/ar${path}`, lastModified: now(), changeFrequency, priority },
    { url: `${SITE_URL}/en${path}`, lastModified: now(), changeFrequency, priority },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    ...localized('', 'daily', 1.0),
    ...localized('/projects', 'hourly', 0.9),
    ...localized('/freelancers', 'daily', 0.9),
    ...localized('/about', 'monthly', 0.7),
    ...localized('/faq', 'monthly', 0.7),
    ...localized('/contact', 'monthly', 0.6),
    ...localized('/help', 'weekly', 0.7),
    ...localized('/privacy', 'yearly', 0.4),
    ...localized('/terms', 'yearly', 0.4),
  ];

  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const projectsList = await db
      .select({ id: projects.id, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.status, 'open'))
      .orderBy(desc(projects.updatedAt))
      .limit(5000);

    projectPages = projectsList.flatMap((project) => [
      {
        url: `${SITE_URL}/ar/projects/${project.id}`,
        lastModified: project.updatedAt ?? now(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/en/projects/${project.id}`,
        lastModified: project.updatedAt ?? now(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ]);
  } catch {
    console.warn('sitemap: skipped dynamic project URLs because the database is unavailable');
  }

  let freelancerPages: MetadataRoute.Sitemap = [];
  try {
    const freelancersList = await db
      .select({ id: users.id, updatedAt: users.updatedAt })
      .from(users)
      .where(eq(users.role, 'freelancer'))
      .orderBy(desc(users.updatedAt))
      .limit(5000);

    freelancerPages = freelancersList.flatMap((freelancer) => [
      {
        url: `${SITE_URL}/ar/freelancers/${freelancer.id}`,
        lastModified: freelancer.updatedAt ?? now(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/en/freelancers/${freelancer.id}`,
        lastModified: freelancer.updatedAt ?? now(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]);
  } catch {
    console.warn('sitemap: skipped dynamic freelancer URLs because the database is unavailable');
  }

  return [...staticPages, ...projectPages, ...freelancerPages];
}
