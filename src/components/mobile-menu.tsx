'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
}

export function MobileMenu({ links, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 md:hidden"
        aria-label="القائمة"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-gray-200 bg-white shadow-sm md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <form action="/projects" method="get" className="mb-3">
              <div className="relative">
                <input
                  type="search"
                  name="q"
                  placeholder="ابحث عن مشروع..."
                  className="w-full rounded-full border border-gray-200 bg-[#f4f5f7] px-4 py-2.5 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-bold text-white">
                    لوحة التحكم
                  </Link>
                  <Link href="/projects/new" onClick={() => setOpen(false)} className="rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white">
                    + أضف مشروع
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white">
                    إنشاء حساب
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
