import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function PasswordResetEmail({ userName, password }: { userName: string; password: string }) {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>تم إعادة تعيين كلمة المرور</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', maxWidth: '600px' }}>
          <Heading style={{ color: '#2386c8', textAlign: 'center' }}>خدمات</Heading>
          <Heading as="h2" style={{ color: '#222' }}>مرحباً {userName}</Heading>
          <Text style={{ color: '#666', lineHeight: '1.8' }}>تم إعادة تعيين كلمة المرور لحسابك. إليك كلمة المرور الجديدة:</Text>
          <div style={{ backgroundColor: '#f4f5f7', padding: '16px', borderRadius: '8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '1px', margin: '20px 0', direction: 'ltr' }}>{password}</div>
          <Text style={{ color: '#dc2626', fontSize: '14px' }}>⚠️ يُنصح بتغيير كلمة المرور فور تسجيل الدخول.</Text>
          <Button href="https://khadamat.com/ar/login" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>تسجيل الدخول</Button>
        </Container>
      </Body>
    </Html>
  );
}
