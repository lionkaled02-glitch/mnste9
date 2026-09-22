import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: {
    default: "خدمات — منصة العمل الحر العربية",
    template: "%s | خدمات",
  },
  description:
    "منصة خدمات العربية — تجمع أصحاب الأعمال والمستقلين في بيئة آمنة بضمان مالي وتوثيق هوية.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // تحقق من اللغة
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // تفعيل التدويل للـ Server Components
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div dir={dir} className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
