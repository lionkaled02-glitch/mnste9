'use client';

import { useActionState, useMemo, useState, useEffect } from 'react';

import { updateSetupSkillsAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };
const SUGGESTIONS = ['Next.js', 'React', 'تصميم واجهات', 'برمجة ويب', 'كتابة محتوى', 'ترجمة', 'تسويق رقمي', 'مونتاج فيديو'];

function parseSkills(value: string | null): string[] {
  return (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function StepSkills({ initialSkills, onComplete }: { initialSkills: string | null; onComplete: () => void }) {
  const [state, formAction, isPending] = useActionState(updateSetupSkillsAction, INITIAL_STATE);
  const [skills, setSkills] = useState(() => parseSkills(initialSkills));
  const [draft, setDraft] = useState('');
  const error = state.fieldErrors?.skills?.[0];
  const skillsString = useMemo(() => skills.join(', '), [skills]);

  useEffect(() => {
    if (state.success) onComplete();
  }, [state.success, onComplete]);

  const addSkill = (raw?: string) => {
    const value = (raw ?? draft).trim();
    if (!value || skills.includes(value) || value.length > 50) return;
    setSkills((prev) => [...prev, value]);
    setDraft('');
  };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="skills" value={skillsString} />

      <div>
        <label htmlFor="setup-skill" className="mb-2 block text-sm font-bold text-slate-800">المهارات</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">لم تضف مهارات بعد.</p>
          ) : (
            skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-[#2386c8]/20 bg-[#2386c8]/10 px-3 py-1 text-sm font-semibold text-[#2386c8]">
                {skill}
                <button type="button" onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))} aria-label={`حذف ${skill}`}>×</button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            id="setup-skill"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSkill();
              }
            }}
            placeholder="اكتب مهارة ثم اضغط Enter"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
          />
          <button type="button" onClick={() => addSkill()} className="rounded-xl border border-[#2386c8]/25 px-4 py-3 text-sm font-bold text-[#2386c8] hover:bg-[#2386c8]/10">إضافة</button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" disabled={skills.includes(suggestion)} onClick={() => addSkill(suggestion)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[#2386c8]/30 hover:text-[#2386c8] disabled:opacity-40">
            + {suggestion}
          </button>
        ))}
      </div>

      {state.message && !state.success && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الحفظ…' : 'حفظ ومتابعة'}
      </button>
    </form>
  );
}
