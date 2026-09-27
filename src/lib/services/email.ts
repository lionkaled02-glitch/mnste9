import { createElement } from 'react';
import { Resend } from 'resend';

import { EscrowReleasedEmail } from '@/lib/email/templates/escrow-released';
import { KYCApprovedEmail } from '@/lib/email/templates/kyc-approved';
import { KYCRejectedEmail } from '@/lib/email/templates/kyc-rejected';
import { NewMessageEmail } from '@/lib/email/templates/new-message';
import { NewProposalEmail } from '@/lib/email/templates/new-proposal';
import { ProposalAcceptedEmail } from '@/lib/email/templates/proposal-accepted';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Resend rejects unverified domains. Keep production configurable, and use
// Resend's verified sandbox sender as a safe fallback for development/testing.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Khadamat <onboarding@resend.dev>';

type EmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!resend) {
    console.warn('sendEmail skipped: RESEND_API_KEY is not configured');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      react: input.react,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (error) {
      console.error('sendEmail failed', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('sendEmail failed', error);
    return false;
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

export async function sendContactEmail(input: { name: string; email: string; subject: string; message: string }) {
  const sent = await sendEmail({
    to: process.env.CONTACT_TO_EMAIL ?? 'support@khadamat.com',
    replyTo: input.email,
    subject: `رسالة تواصل جديدة: ${input.subject}`,
    react: createElement(
      'div',
      { style: { fontFamily: 'Arial, sans-serif', direction: 'rtl', lineHeight: 1.8, color: '#222' } },
      createElement('h1', { style: { color: '#2386c8' } }, 'رسالة تواصل جديدة من خدمات'),
      createElement('p', null, `الاسم: ${input.name}`),
      createElement('p', null, `البريد: ${input.email}`),
      createElement('p', null, `الموضوع: ${input.subject}`),
      createElement('hr'),
      createElement('p', { style: { whiteSpace: 'pre-wrap' } }, input.message),
    ),
  });

  if (!sent) throw new Error('contact email failed');
}
