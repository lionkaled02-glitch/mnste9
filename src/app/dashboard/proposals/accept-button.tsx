'use client';

import { useActionState } from 'react';

import type { AuthActionState } from '@/lib/auth';
import { acceptProposalAction } from '@/app/actions/proposals';

const initialState: AuthActionState = { success: false };

export function AcceptProposalButton({ proposalId }: { proposalId: number }) {
  const [state, formAction, isPending] = useActionState(
    acceptProposalAction,
    initialState,
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposalId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'جاري القبول…' : 'قبول العرض وإنشاء عقد'}
        </button>
      </form>
      {state.message && (
        <p
          className={`max-w-xs rounded border px-3 py-2 text-xs ${
            state.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
