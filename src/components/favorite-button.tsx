'use client';

/**
 * ============================================================================
 *  mnste9 — زر المفضلة (قلب) — المرحلة 10 نهائي
 * ============================================================================
 *  - يعمل بـ localStorage لتجنب تعديل Drizzle/الهجرات (القاعدة الصارمة).
 *  - إذا لم يكن مسجلاً: يوجه إلى /login
 *  - إذا مسجل: يضيف/يزيل من wishlist المحلية.
 *  - نوعان: project | freelancer
 *  - تصميم Tailwind بسيط RTL
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  type: 'project' | 'freelancer';
  id: number;
  isLoggedIn?: boolean;
  size?: 'sm' | 'md';
}

function getStorageKey(type: Props['type']) {
  return type === 'project' ? 'mnste9_fav_projects' : 'mnste9_fav_freelancers';
}

function readFavs(type: Props['type']): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(type));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeFavs(type: Props['type'], ids: number[]) {
  try {
    localStorage.setItem(getStorageKey(type), JSON.stringify(ids));
  } catch {
    // ignore quota
  }
}

export function FavoriteButton({ type, id, isLoggedIn = false, size = 'sm' }: Props) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const favs = readFavs(type);
    setFavorited(favs.includes(id));
  }, [type, id]);

  const toggle = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const favs = readFavs(type);
    let next: number[];
    if (favs.includes(id)) {
      next = favs.filter((x) => x !== id);
      setFavorited(false);
    } else {
      next = [...favs, id];
      setFavorited(true);
    }
    writeFavs(type, next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={`flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 ${
          size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
        }`}
        aria-label="المفضلة"
      >
        ♡
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      title={favorited ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
      className={`flex items-center justify-center rounded-full border shadow-sm transition ${
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
