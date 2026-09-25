'use client';

/**
 * ============================================================================
 *  خدمات — زر «تواصل مع المستقل» (Client Component)
 * ============================================================================
 *  يُستخدم من صفحة السيرفر /freelancers/[id] بدل onClick مباشر
 *  ("Event handlers cannot be passed to Client Component props").
 *  - زائر غير مسجل → رابط تسجيل الدخول مع العودة إلى الصفحة نفسها.
 *  - المستخدم نفسه → لا زر (لا محادثة مع النفس).
 *  - مسجل → ينشئ/يفتح محادثة عبر createConversationAction ثم ينتقل إلى
 *    صفحة الرسائل (المحادثة نفسها إن وُجدت مسبقاً).
 * ============================================================================
 */

import { useState, useTransition } from 'react';

import { createConversationAction } from '@/app/actions/messages';
import { Link, useRouter } from '@/i18n/navigation';

interface ContactFreelancerButtonProps {
  freelancerId: number;
  isLoggedIn: boolean;
  isSelf?: boolean;
  className?: string;
}

const DEFAULT_CLASSES =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-[#2386c8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a6da8] disabled:cursor-not-allowed disabled:opacity-60';

export function ContactFreelancerButton({
  freelancerId,
  isLoggedIn,
  isSelf = false,
  className = DEFAULT_CLASSES,
}: ContactFreelancerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) return null;

  if (!isLoggedIn) {
    return (
      <Link href={`/login?from=/freelancers/${freelancerId}`} className={className}>
        سجّل دخولك للتواصل
      </Link>
    );
  }

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('otherUserId', String(freelancerId));
      const result = await createConversationAction(formData);
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      if (!result.success && result.redirectTo) {
        router.push(`${result.redirectTo}?from=/freelancers/${freelancerId}`);
        return;
      }
      setError(result.message || 'تعذّر فتح المحادثة — حاول مرة أخرى');
    });
  };

  return (
    <div className="w-full">
      <button type="button" onClick={handleClick} disabled={isPending} className={className}>
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            جارٍ فتح المحادثة…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            تواصل مع المستقل
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
