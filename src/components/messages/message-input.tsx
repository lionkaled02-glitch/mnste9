'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { sendMessageAction } from '@/app/actions/messages';
import type { AuthActionState } from '@/lib/auth';

const INITIAL: AuthActionState = { success: false };

export function MessageInput({ conversationId, otherUserId, projectId }: { conversationId?: number; otherUserId?: number; projectId?: number | null }) {
  const [state, formAction, isPending] = useActionState(sendMessageAction, INITIAL);
  const [value, setValue] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setValue('');
      // لا نعمل reset كامل لأننا نريد الحفاظ على المحادثة
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      {conversationId && <input type="hidden" name="conversationId" value={conversationId} />}
      {otherUserId && <input type="hidden" name="otherUserId" value={otherUserId} />}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <div className="flex-1 relative">
        <textarea
          name="content"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder="اكتب رسالتك..."
          rows={1}
          maxLength={2000}
          required
          disabled={isPending}
          className="max-h-[120px] min-h-[44px] w-full resize-none rounded-[12px] border border-gray-200 bg-[#f4f5f7] px-4 py-3 text-[13px] text-[#222] placeholder-[#999] outline-none focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/15 disabled:opacity-60"
        />
        {state.message && !state.success && (
          <p className="absolute -top-6 start-0 text-[11px] text-red-600">{state.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#2386c8] text-white shadow-sm transition hover:bg-[#1a6da8] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="إرسال"
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        )}
      </button>
    </form>
  );
}
