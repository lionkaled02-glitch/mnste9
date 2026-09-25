'use client';

/**
 * خدمات — زر المفضلة (Wishlist)
 * يستخدم جدول wishlist عبر Server Action بدلاً من localStorage.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { toggleWishlistItem, type WishlistItemType } from '@/app/actions/wishlist';

interface Props {
  type: WishlistItemType;
  id: number;
  isLoggedIn?: boolean;
  initialFavorited?: boolean;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ type, id, isLoggedIn = false, initialFavorited = false, size = 'sm' }: Props) {
  const router = useRouter();
  const itemKey = `${type}:${id}`;
  const [favoriteState, setFavoriteState] = useState(() => ({
    itemKey,
    initialFavorited,
    favorited: initialFavorited,
  }));
  const [isPending, startTransition] = useTransition();

  let favorited = favoriteState.favorited;
  if (favoriteState.itemKey !== itemKey || favoriteState.initialFavorited !== initialFavorited) {
    favorited = initialFavorited;
    setFavoriteState({ itemKey, initialFavorited, favorited: initialFavorited });
  }

  const setFavorited = (next: boolean) => {
    setFavoriteState({ itemKey, initialFavorited, favorited: next });
  };

  const toggle = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const optimistic = !favorited;
    setFavorited(optimistic);

    startTransition(async () => {
      const result = await toggleWishlistItem(type, id);
      if (result.success) {
        setFavorited(result.favorited);
      } else {
        setFavorited(!optimistic);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      title={favorited ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
      className={`flex items-center justify-center rounded-full border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
        size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
      } ${
        favorited
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:text-red-500'
      }`}
    >
      {favorited ? '❤️' : '♡'}
    </button>
  );
}
