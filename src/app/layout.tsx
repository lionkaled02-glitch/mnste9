import type { Metadata } from "next";
import "./globals.css";

// Tajawal مع fallback للبيئات غير المتصلة
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

// Root layout minimal — لا يحتوي Header/Footer
// Header/Footer يأتيان من [locale]/layout.tsx لحل مشكلة التدويل /ar prefix
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.className} h-full antialiased`}>
      <body className={`min-h-full flex flex-col bg-[#f4f5f7] ${tajawal.variable || ""}`}>
        {children}
      </body>
    </html>
  );
}
