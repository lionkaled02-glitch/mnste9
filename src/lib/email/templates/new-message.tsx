import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function NewMessageEmail({ userName, senderName, excerpt }: { userName: string; senderName: string; excerpt: string }) {
  return <Html dir="rtl" lang="ar"><Head /><Preview>رسالة جديدة</Preview><Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}><Container style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px' }}><Heading style={{ color: '#2386c8' }}>رسالة جديدة</Heading><Text>مرحباً {userName}، لديك رسالة جديدة من {senderName}.</Text><Text style={{ color: '#666' }}>{excerpt}</Text><Button href="https://khadamat.com/ar/dashboard/messages" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px' }}>فتح الرسائل</Button></Container></Body></Html>;
}
