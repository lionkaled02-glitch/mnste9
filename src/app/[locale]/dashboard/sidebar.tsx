import { ClientSidebar } from './client-sidebar';
import { FreelancerSidebar } from './freelancer-sidebar';

export function DashboardSidebar({ role, setupComplete = true }: { role: string | null; setupComplete?: boolean }) {
  if (role === 'client') {
    return <ClientSidebar />;
  }

  return <FreelancerSidebar setupComplete={setupComplete} />;
}
