import { getMyReviewsDashboard } from '@/app/actions/reviews';

import { ReviewsTabs } from './reviews-tabs';

export default async function ReviewsPage() {
  const data = await getMyReviewsDashboard();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
      <ReviewsTabs data={data} />
    </main>
  );
}
