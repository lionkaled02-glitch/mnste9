'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';

export async function becomeFreelancer(): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً',
      redirectTo: '/login',
    };
  }

  if (currentUser.role === 'freelancer') {
    return {
      success: true,
      message: 'أنت مستقل بالفعل',
      redirectTo: '/dashboard/kyc',
    };
  }

  if (currentUser.role === 'admin') {
    return {
      success: false,
      message: 'المشرف لا يحتاج ترقية',
    };
  }

  try {
    await db.update(users).set({ role: 'freelancer' }).where(eq(users.id, currentUser.id));

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');

    return {
      success: true,
      message: 'تمت ترقيتك إلى مستقل — وثّق هويتك للبدء',
      redirectTo: '/dashboard/kyc',
    };
  } catch (error) {
    console.error('becomeFreelancer failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع — حاول مرة أخرى',
    };
  }
}

export async function becomeFreelancerAction(
  _prev: AuthActionState,
  _formData: FormData,
): Promise<AuthActionState> {
  return becomeFreelancer();
}
