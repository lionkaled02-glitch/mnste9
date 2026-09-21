import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // رفع وثائق KYC حتى 5 ميغابايت عبر Server Actions — الافتراضي 1MB
  // يرفض الملفات الكبيرة قبل وصولها لتحقق التطبيق (راجع kyc-meta.ts)
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
