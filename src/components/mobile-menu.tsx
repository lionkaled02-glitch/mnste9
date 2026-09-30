'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';

interface MenuLink {
  href: string;
  label: string;
  icon?: string;
}

interface Props {
  links: MenuLink[];
  isLoggedIn: boolean;
}

export function MobileMenu({ links, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 lg:hidden"
        aria-label="فتح القائمة"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl lg:hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="text-2xl font-extrabold tracking-tight text-[#222]">خدمات</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="إغلاق"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-gray-100 px-5 py-4">
              <form action="/projects" method="get">
                <div className="relative">
                  <input
                    type="search"
                    name="q"
                    placeholder="ابحث عن..."
                    className="w-full rounded-lg border border-gray-200 bg-[#f4f5f7] px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/15"
                  />
                  <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </form>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-0.5 p-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium text-gray-700 transition hover:bg-[#2386c8]/5 hover:text-[#2386c8]"
                >
                  {link.icon && <span className="text-lg">{link.icon}</span>}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-100 p-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg bg-[#2386c8] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#1a6da8]"
                >
                  لوحة التحكم
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-lg bg-[#2386c8] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#1a6da8]"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
