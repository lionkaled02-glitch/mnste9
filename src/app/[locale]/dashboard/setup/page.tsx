import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

import { getFreelancerSetupState, getFreelancerSetupValues } from './setup-data';
import { isFreelancerSetupComplete } from './setup-helpers';
import { SetupWizard } from './setup-wizard';

export const metadata: Metadata = {
  title: 'إعداد الحساب | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?from=/dashboard/setup');

  if (user.role !== 'freelancer') redirect('/dashboard');

  const [state, values] = await Promise.all([
    getFreelancerSetupState(user.id),
    getFreelancerSetupValues(user.id),
  ]);

  if (isFreelancerSetupComplete(state)) redirect('/dashboard?setup=complete');
  if (!values) redirect('/login?from=/dashboard/setup');

  return <SetupWizard initialState={state} initialValues={values} userName={user.name} />;
}
