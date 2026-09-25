import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { formatDate } from '@/lib/utils';

import { ClientProfileForm } from './profile-form-client';


interface ClientProfileProps {
  user: { id: number; name: string; email: string };
}

export async function ClientProfile({ user }: ClientProfileProps) {
  const profile = await db
    .select({
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      phone: users.phone,
      city: users.city,
      preferredCurrency: users.preferredCurrency,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!profile) return null;

  const initial = profile.name.trim().charAt(0) || 'م';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-slate-500">بيانات صاحب العمل وتفضيلاته لنشر المشاريع ومتابعتها.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="h-28 w-28 rounded-full object-cover shadow-inner ring-4 ring-[#2386c8]/10" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#2386c8]/20 text-4xl font-bold text-[#2386c8] shadow-inner ring-4 ring-[#2386c8]/10">
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-right">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">صاحب عمل</span>
            </div>
            <p dir="ltr" className="mt-2 text-left text-sm text-slate-500 sm:text-right">{profile.email}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              {profile.phone && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600" dir="ltr">{profile.phone}</span>}
              {profile.city && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{profile.city}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">عضو منذ {formatDate(profile.createdAt)}</span>
            </div>
            <Link href="/projects/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#2386c8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a6da8]">
              نشر مشروع جديد
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ClientProfileForm
          defaultValues={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            preferredCurrency: profile.preferredCurrency,
            avatarUrl: profile.avatarUrl,
          }}
        />
      </section>

    </div>
  );
}
