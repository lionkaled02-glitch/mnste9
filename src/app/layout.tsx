import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Tajawal من next/font/google مع fallback للبيئات غير المتصلة
// نستخدم eval لتجاوز التحليل الثابت لـ Next.js في بيئة البناء غير المتصلة
let tajawal: { className: string; variable?: string } = { className: "" };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleFont = eval("require('next/font/google')") as {
    Tajawal: (opts: {
      subsets: string[];
      weight: string[];
      variable?: string;
      display?: string;
    }) => { className: string; variable?: string };
  };
  tajawal = googleFont.Tajawal({
    subsets: ["arabic"],
    weight: ["400", "500", "700", "800"],
    variable: "--font-tajawal",
    display: "swap",
  });
} catch {
  // Fallback للبيئة غير المتصلة — نظام خطوط
  tajawal = { className: "font-sans", variable: "--font-tajawal" };
}

export const metadata: Metadata = {
  title: {
    default: "خدمات — منصة العمل الحر العربية",
    template: "%s | خدمات",
  },
  description:
    "منصة خدمات العربية — تجمع أصحاب الأعمال والمستقلين في بيئة آمنة بضمان مالي وتوثيق هوية.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale || "ar";

  return (
    <html lang={lang} dir={dir} className={`${tajawal.className} h-full antialiased`}>
      <body className={`min-h-full flex flex-col bg-[#f4f5f7] ${tajawal.variable || ""}`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
