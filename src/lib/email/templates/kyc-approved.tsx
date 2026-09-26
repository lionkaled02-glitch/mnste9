import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function KYCApprovedEmail({ userName }: { userName: string }) {
  return (
    <Html dir="rtl" lang="ar"><Head /><Preview>تم توثيق هويتك بنجاح</Preview><Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}><Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', maxWidth: '600px' }}><Heading style={{ color: '#2386c8', textAlign: 'center' }}>خدمات</Heading><Heading as="h2" style={{ color: '#222' }}>مرحباً {userName} 👋</Heading><Text style={{ color: '#666', lineHeight: '1.8' }}>تم توثيق هويتك بنجاح. يمكنك الآن تقديم عروض على المشاريع وسحب الأرباح.</Text><Button href="https://khadamat.com/ar/dashboard" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>ابدأ الآن</Button></Container></Body></Html>
  );
}
