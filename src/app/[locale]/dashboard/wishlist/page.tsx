import { getMyWishlistItems } from '@/app/actions/wishlist';

import { WishlistTabs } from './wishlist-tabs';

export default async function WishlistPage() {
  const data = await getMyWishlistItems();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
      <WishlistTabs data={data} />
    </main>
  );
}
