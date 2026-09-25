import { ClientSidebar } from './client-sidebar';
import { FreelancerSidebar } from './freelancer-sidebar';

export function DashboardSidebar({ role, setupComplete = true, isKycVerified = false }: { role: string | null; setupComplete?: boolean; isKycVerified?: boolean }) {
  if (role === 'client') {
    return <ClientSidebar />;
  }

  return <FreelancerSidebar setupComplete={setupComplete} isKycVerified={isKycVerified} />;
}
