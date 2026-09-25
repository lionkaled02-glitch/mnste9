import { ClientSidebar } from './client-sidebar';
import { FreelancerSidebar } from './freelancer-sidebar';

export function DashboardSidebar({ role }: { role: string | null }) {
  if (role === 'client') {
    return <ClientSidebar />;
  }

  return <FreelancerSidebar />;
}
