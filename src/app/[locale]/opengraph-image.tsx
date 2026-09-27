import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'خدمات — منصة العمل الحر العربية';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #2386c8 0%, #1a6da8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '80px',
          fontFamily: 'sans-serif',
          direction: isAr ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 'bold', marginBottom: 20 }}>خدمات</div>
        <div style={{ fontSize: 40, opacity: 0.9 }}>
          {isAr ? 'منصة العمل الحر العربية الأولى' : 'The #1 Arab Freelance Platform'}
        </div>
      </div>
    ),
    { ...size },
  );
}
