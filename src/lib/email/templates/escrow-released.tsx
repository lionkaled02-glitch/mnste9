import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function EscrowReleasedEmail({ userName, amount, projectTitle }: { userName: string; amount: string | number; projectTitle: string }) {
  return <Html dir="rtl" lang="ar"><Head /><Preview>تم تحرير دفعة الضمان</Preview><Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}><Container style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px' }}><Heading style={{ color: '#2386c8' }}>تم تحرير الدفعة ✅</Heading><Text>مرحباً {userName}، تم تحرير ${amount} لعقد مشروع: {projectTitle}.</Text><Button href="https://khadamat.com/ar/dashboard/wallet" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px' }}>فتح المحفظة</Button></Container></Body></Html>;
}
