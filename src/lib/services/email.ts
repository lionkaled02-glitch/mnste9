import { Resend } from 'resend';

import { EscrowReleasedEmail } from '@/lib/email/templates/escrow-released';
import { KYCApprovedEmail } from '@/lib/email/templates/kyc-approved';
import { KYCRejectedEmail } from '@/lib/email/templates/kyc-rejected';
import { NewMessageEmail } from '@/lib/email/templates/new-message';
import { NewProposalEmail } from '@/lib/email/templates/new-proposal';
import { ProposalAcceptedEmail } from '@/lib/email/templates/proposal-accepted';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'خدمات <noreply@khadamat.com>';

async function sendEmail(input: { to: string; subject: string; react: React.ReactElement }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({ from: FROM_EMAIL, ...input });
  } catch (error) {
    console.error('sendEmail failed', error);
  }
}

export async function sendKYCApprovedEmail(to: string, userName: string) {
  await sendEmail({ to, subject: 'تم توثيق هويتك بنجاح ✅', react: KYCApprovedEmail({ userName }) });
}

export async function sendKYCRejectedEmail(to: string, userName: string, reason: string) {
  await sendEmail({ to, subject: 'تم رفض توثيق هويتك', react: KYCRejectedEmail({ userName, reason }) });
}

export async function sendNewProposalEmail(to: string, userName: string, projectTitle: string, amount: string | number, freelancerName: string) {
  await sendEmail({ to, subject: 'عرض جديد على مشروعك', react: NewProposalEmail({ userName, projectTitle, amount, freelancerName }) });
}

export async function sendProposalAcceptedEmail(to: string, userName: string, projectTitle: string) {
  await sendEmail({ to, subject: 'تم قبول عرضك 🎉', react: ProposalAcceptedEmail({ userName, projectTitle }) });
}

export async function sendNewMessageEmail(to: string, userName: string, senderName: string, excerpt: string) {
  await sendEmail({ to, subject: 'رسالة جديدة على خدمات', react: NewMessageEmail({ userName, senderName, excerpt }) });
}

export async function sendEscrowReleasedEmail(to: string, userName: string, amount: string | number, projectTitle: string) {
  await sendEmail({ to, subject: 'تم تحرير دفعة الضمان ✅', react: EscrowReleasedEmail({ userName, amount, projectTitle }) });
}
