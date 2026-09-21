import type { Metadata } from "next";
import "./globals.css";

/**
 * ملاحظة: تم استبدال خطوط Google (Geist) بخطوط النظام لتفادي فشل البناء
 * في البيئات غير المتصلة (offline) — الخطوط الأصلية كانت تتطلب اتصالاً
 * بـ fonts.googleapis.com أثناء البناء. التصميم يحافظ على نفس المظهر
 * عبر fallback إلى system-ui.
 */

export const metadata: Metadata = {
  title: {
    default: "mnste9 — منصة العمل الحر العربية",
    template: "%s | mnste9",
  },
  description:
    "منصة عربية آمنة تجمع أصحاب الأعمال والمستقلين — محافظ رقمية، ضمان مالي (Escrow)، ودفع عبر الكريمي وPayPal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
