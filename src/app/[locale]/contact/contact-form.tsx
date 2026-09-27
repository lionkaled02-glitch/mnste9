'use client';

import { useActionState } from 'react';

import { sendContactMessageAction, type ContactActionState } from '@/app/actions/contact';

interface ContactFormLabels {
  name: string;
  email: string;
  subject: string;
  message: string;
  submit: string;
  submitting: string;
  success: string;
  invalid: string;
  error: string;
}

export function ContactForm({ labels }: { labels: ContactFormLabels }) {
  const [state, formAction, isPending] = useActionState<ContactActionState, FormData>(sendContactMessageAction, {});

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-slate-700">
          {labels.name}
        </label>
        <input
          id="contact-name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2386c8] focus:ring-4 focus:ring-[#2386c8]/10"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-sm font-bold text-slate-700">
          {labels.email}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2386c8] focus:ring-4 focus:ring-[#2386c8]/10"
        />
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-bold text-slate-700">
          {labels.subject}
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          minLength={3}
          maxLength={200}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2386c8] focus:ring-4 focus:ring-[#2386c8]/10"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-slate-700">
          {labels.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#2386c8] focus:ring-4 focus:ring-[#2386c8]/10"
        />
      </div>

      {state.success && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{labels.success}</p>}
      {state.error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{state.error === 'invalid' ? labels.invalid : labels.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#2386c8] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1a6da8] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
