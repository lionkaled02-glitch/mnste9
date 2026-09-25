import { getMyPortfolio } from '@/app/actions/portfolio';

import { PortfolioGrid } from './portfolio-grid';

export default async function PortfolioPage() {
  const items = await getMyPortfolio();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
      <PortfolioGrid initialItems={items} />
    </main>
  );
}
