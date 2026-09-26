import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function ProposalAcceptedEmail({ userName, projectTitle }: { userName: string; projectTitle: string }) {
  return <Html dir="rtl" lang="ar"><Head /><Preview>تم قبول عرضك</Preview><Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}><Container style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px' }}><Heading style={{ color: '#2386c8' }}>تهانينا 🎉</Heading><Text>مرحباً {userName}، تم قبول عرضك على مشروع: {projectTitle}. تم إنشاء العقد وحجز مبلغ الضمان.</Text><Button href="https://khadamat.com/ar/dashboard/contracts" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px' }}>عرض العقد</Button></Container></Body></Html>;
}
