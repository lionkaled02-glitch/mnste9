import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export function NewProposalEmail({ userName, projectTitle, amount, freelancerName }: { userName: string; projectTitle: string; amount: string | number; freelancerName: string }) {
  return <Html dir="rtl" lang="ar"><Head /><Preview>عرض جديد على مشروعك</Preview><Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '40px 0' }}><Container style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px' }}><Heading style={{ color: '#2386c8' }}>عرض جديد</Heading><Text>مرحباً {userName}، قدم {freelancerName} عرضاً بقيمة ${amount} على مشروعك: {projectTitle}.</Text><Button href="https://khadamat.com/ar/dashboard/projects" style={{ backgroundColor: '#2386c8', color: '#fff', padding: '12px 24px', borderRadius: '8px' }}>مراجعة العرض</Button></Container></Body></Html>;
}
