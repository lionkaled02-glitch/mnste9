import { SETUP_STEPS, type SetupStep } from './setup-helpers';

interface ProgressBarProps {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  progress: number;
}

export function ProgressBar({ currentStep, completedSteps, progress }: ProgressBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>تقدم إعداد الحساب</span>
        <span dir="ltr">{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#2386c8] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-5">
        {SETUP_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = currentStep === step.key;
          return (
            <li key={step.key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex-col sm:text-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-[#2386c8] text-white'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className={`text-[11px] font-bold ${isCurrent ? 'text-[#2386c8]' : isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
