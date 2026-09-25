export type SetupStep = 'phone' | 'bio' | 'skills' | 'kyc' | 'portfolio' | 'complete';

export interface SetupState {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  progress: number;
}

export interface SetupProfileValues {
  phone: string | null;
  bio: string | null;
  skills: string | null;
  isKycVerified: boolean;
  hasKycRequest: boolean;
  portfolioCount: number;
}

export const SETUP_STEPS = [
  { key: 'phone', title: 'تأكيد رقم الجوال', description: 'أضف رقم جوالك بصيغة دولية لاستلام التنبيهات المهمة.' },
  { key: 'bio', title: 'النبذة التعريفية', description: 'عرّف العملاء بخبرتك وطريقة عملك.' },
  { key: 'skills', title: 'المهارات', description: 'أضف مهاراتك الأساسية ليسهل العثور عليك.' },
  { key: 'kyc', title: 'توثيق الهوية', description: 'ارفع وثائق التحقق لبناء الثقة وتفعيل العمل كمستقل.' },
  { key: 'portfolio', title: 'معرض الأعمال', description: 'أضف عملاً واحداً على الأقل ليشاهده العملاء.' },
] as const satisfies readonly { key: Exclude<SetupStep, 'complete'>; title: string; description: string }[];

const TOTAL_STEPS = SETUP_STEPS.length;

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function getNextSetupStep(step: SetupStep): SetupStep {
  const index = SETUP_STEPS.findIndex((item) => item.key === step);
  if (index < 0 || index === SETUP_STEPS.length - 1) return 'complete';
  return SETUP_STEPS[index + 1].key;
}

export function buildSetupState(values: SetupProfileValues): SetupState {
  const completedSteps: SetupStep[] = [];

  if (hasText(values.phone)) completedSteps.push('phone');
  if (hasText(values.bio)) completedSteps.push('bio');
  if (hasText(values.skills)) completedSteps.push('skills');
  if (values.isKycVerified || values.hasKycRequest) completedSteps.push('kyc');
  if (values.portfolioCount > 0) completedSteps.push('portfolio');

  const currentStep = SETUP_STEPS.find((step) => !completedSteps.includes(step.key))?.key ?? 'complete';
  const progress = Math.round((completedSteps.length / TOTAL_STEPS) * 100);

  return { currentStep, completedSteps, progress };
}

export function isFreelancerSetupComplete(state: SetupState): boolean {
  return state.currentStep === 'complete';
}
