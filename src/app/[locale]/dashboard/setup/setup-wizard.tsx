'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ProgressBar } from './progress-bar';
import { SETUP_STEPS, getNextSetupStep, type SetupProfileValues, type SetupState, type SetupStep } from './setup-helpers';
import { StepBio } from './steps/step-bio';
import { StepKyc } from './steps/step-kyc';
import { StepPhone } from './steps/step-phone';
import { StepPortfolio } from './steps/step-portfolio';
import { StepSkills } from './steps/step-skills';

interface SetupWizardProps {
  initialState: SetupState;
  initialValues: SetupProfileValues;
  userName: string;
}

export function SetupWizard({ initialState, initialValues, userName }: SetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>(initialState.currentStep);
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>(initialState.completedSteps);

  const progress = useMemo(() => Math.round((completedSteps.filter((step) => step !== 'complete').length / SETUP_STEPS.length) * 100), [completedSteps]);

  const completeStep = useCallback(
    (step: SetupStep) => {
      const nextStep = getNextSetupStep(step);
      setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));

      if (nextStep === 'complete') {
        router.push('/dashboard/pending-review');
        router.refresh();
        return;
      }

      setCurrentStep(nextStep);
    },
    [router],
  );

  const stepMeta = SETUP_STEPS.find((step) => step.key === currentStep) ?? SETUP_STEPS[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#2386c8] to-[#1a6da8] p-8 text-white shadow-sm">
        <p className="text-sm font-semibold text-white/80">مرحباً {userName}</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">إعداد حسابك كمستقل</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85">
          أكمل الخطوات الخمس التالية لتهيئة ملفك للظهور للعملاء وتقديم العروض بثقة.
        </p>
      </div>

      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} progress={progress} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <p className="text-xs font-bold text-[#2386c8]">الخطوة الحالية</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">{stepMeta.title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">{stepMeta.description}</p>
        </div>

        {currentStep === 'phone' && <StepPhone initialPhone={initialValues.phone} onComplete={() => completeStep('phone')} />}
        {currentStep === 'bio' && <StepBio initialBio={initialValues.bio} onComplete={() => completeStep('bio')} />}
        {currentStep === 'skills' && <StepSkills initialSkills={initialValues.skills} onComplete={() => completeStep('skills')} />}
        {currentStep === 'kyc' && <StepKyc alreadySubmitted={initialValues.isKycVerified || initialValues.hasKycRequest} onComplete={() => completeStep('kyc')} />}
        {currentStep === 'portfolio' && <StepPortfolio initialCount={initialValues.portfolioCount} onComplete={() => completeStep('portfolio')} />}
      </section>
    </div>
  );
}
