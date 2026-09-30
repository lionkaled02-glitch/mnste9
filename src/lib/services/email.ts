import { createElement } from 'react';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

import { EscrowReleasedEmail } from '@/lib/email/templates/escrow-released';
import { KYCApprovedEmail } from '@/lib/email/templates/kyc-approved';
import { KYCRejectedEmail } from '@/lib/email/templates/kyc-rejected';
import { NewMessageEmail } from '@/lib/email/templates/new-message';
import { NewProposalEmail } from '@/lib/email/templates/new-proposal';
import { PasswordResetEmail } from '@/lib/email/templates/password-reset';
import { ProposalAcceptedEmail } from '@/lib/email/templates/proposal-accepted';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Khadamat';

const transporter =
  GMAIL_USER && GMAIL_APP_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASS,
        },
      })
    : null;

const FROM_EMAIL = GMAIL_USER
  ? `${FROM_NAME} <${GMAIL_USER}>`
  : 'Khadamat <no-reply@localhost>';

type EmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!transporter) {
    console.warn(
      'sendEmail skipped: GMAIL_USER or GMAIL_APP_PASS is not configured',
    );
    return false;
  }

  try {
    const html = await render(input.react);
    const text = await render(input.react, { plainText: true });

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html,
      text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (!info?.messageId) {
      console.error('sendEmail failed: no messageId returned');
      return false;
    }

    return true;
  } catch (error) {
    console.error('sendEmail failed', error);
    return false;
  }
}

export async function sendKYCApprovedEmail(to: string, userName: string) {
  await sendEmail({
    to,
    subject: 'تمت الموافقة على وثائق KYC الخاصة بك',
    react: KYCApprovedEmail({ userName }),
  });
}

export async function sendKYCRejectedEmail(
  to: string,
  userName: string,
  reason: string,
) {
  await sendEmail({
    to,
    subject: 'تم رفض وثائق KYC الخاصة بك',
    react: KYCRejectedEmail({ userName, reason }),
  });
}

export async function sendNewProposalEmail(
  to: string,
  userName: string,
  projectTitle: string,
  amount: string | number,
  freelancerName: string,
) {
  await sendEmail({
    to,
    subject: 'عرض جديد على مشروعك',
    react: NewProposalEmail({ userName, projectTitle, amount, freelancerName }),
  });
}

export async function sendProposalAcceptedEmail(
  to: string,
  userName: string,
  projectTitle: string,
) {
  await sendEmail({
    to,
    subject: 'تم قبول عرضك',
    react: ProposalAcceptedEmail({ userName, projectTitle }),
  });
}

export async function sendNewMessageEmail(
  to: string,
  userName: string,
  senderName: string,
  excerpt: string,
) {
  await sendEmail({
    to,
    subject: 'رسالة جديدة على المنصة',
    react: NewMessageEmail({ userName, senderName, excerpt }),
  });
}

export async function sendEscrowReleasedEmail(
  to: string,
  userName: string,
  amount: string | number,
  projectTitle: string,
) {
  await sendEmail({
    to,
    subject: 'تم تحرير دفعة من الضمان',
    react: EscrowReleasedEmail({ userName, amount, projectTitle }),
  });
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const sent = await sendEmail({
    to: process.env.CONTACT_TO_EMAIL ?? 'support@khadamat.com',
    replyTo: input.email,
    subject: `رسالة من نموذج الاتصال: ${input.subject}`,
    react: createElement(
      'div',
      {
        style: {
          fontFamily: 'Arial, sans-serif',
          direction: 'rtl',
          lineHeight: 1.8,
          color: '#222',
        },
      },
      createElement(
        'h1',
        { style: { color: '#2386c8' } },
        'رسالة جديدة من نموذج الاتصال',
      ),
      createElement('p', null, `الاسم: ${input.name}`),
      createElement('p', null, `البريد: ${input.email}`),
      createElement('p', null, `الموضوع: ${input.subject}`),
      createElement('hr'),
      createElement(
        'p',
        { style: { whiteSpace: 'pre-wrap' } },
        input.message,
      ),
    ),
  });

  if (!sent) throw new Error('contact email failed');
}

export async function sendPasswordResetEmail(input: {
  email: string;
  userName: string;
  password: string;
}) {
  return sendEmail({
    to: input.email,
    subject: 'إعادة تعيين كلمة المرور - منصة خدمات',
    react: PasswordResetEmail({
      userName: input.userName,
      password: input.password,
    }),
  });
}
