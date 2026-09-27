'use server';

import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

export type ContactActionState = {
  success?: boolean;
  error?: 'invalid' | 'failed';
};

export async function sendContactMessageAction(_prevState: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { error: 'invalid' };
  }

  try {
    const { sendContactEmail } = await import('@/lib/services/email');
    await sendContactEmail(parsed.data);
    return { success: true };
  } catch (error) {
    console.error('contact failed', error);
    return { error: 'failed' };
  }
}
