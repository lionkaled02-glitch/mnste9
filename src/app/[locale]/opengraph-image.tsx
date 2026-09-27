import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Khadamat — Arab Freelance Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2386c8 0%, #1a6da8 48%, #0f3d5e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '72px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.22) 0, transparent 30%), radial-gradient(circle at 82% 82%, rgba(255,255,255,0.15) 0, transparent 28%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            border: '2px solid rgba(255,255,255,0.22)',
            borderRadius: 42,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 136,
              height: 136,
              borderRadius: 34,
              background: 'white',
              color: '#2386c8',
              fontSize: 74,
              fontWeight: 900,
              marginBottom: 34,
              boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            }}
          >
            K
          </div>

          <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>
            Khadamat
          </div>

          <div style={{ marginTop: 22, fontSize: 36, fontWeight: 700, opacity: 0.92 }}>
            {isAr ? 'Arab Freelance Platform' : 'The Arab Freelance Platform'}
          </div>

          <div
            style={{
              marginTop: 34,
              display: 'flex',
              gap: 14,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            <span style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>Escrow</span>
            <span style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>KYC</span>
            <span style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>Secure Work</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
