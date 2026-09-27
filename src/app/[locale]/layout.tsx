import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "خدمات — منصة العمل الحر العربية",
    template: "%s | خدمات",
  },
  description:
    "منصة خدمات العربية — تجمع أصحاب الأعمال والمستقلين في بيئة آمنة بضمان مالي وتوثيق هوية.",
  keywords: ["خدمات", "عمل حر", "مستقلين", "مشاريع", "توظيف مستقلين", "freelance", "Yemen"],
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "خدمات — منصة العمل الحر العربية",
    description: "منصة خدمات العربية — تجمع أصحاب الأعمال والمستقلين في بيئة آمنة بضمان مالي وتوثيق هوية.",
    type: "website",
    siteName: "خدمات",
  },
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
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // تفعيل التدويل للـ Server Components
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <ToastProvider>
        <div dir={dir} className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
