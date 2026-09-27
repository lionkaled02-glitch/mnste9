'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteUser, toggleUserActive, updateUserRole } from '@/app/actions/admin';
import { ResetPasswordButton } from './reset-password-button';

export function UserDetailActions({ userId, role, isActive }: { userId: number; role: 'client' | 'freelancer' | 'admin'; isActive: boolean }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(role);
  const [toast, setToast] = useState('');
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ success: boolean; message?: string }>, redirect = false) => startTransition(async () => { const r = await fn(); setToast(r.message ?? 'تم التنفيذ'); if (redirect && r.success) window.location.href = '/admin/users'; else router.refresh(); });
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-extrabold text-[#1a1a2e]">إجراءات الحساب</h2><div className="mt-4 grid gap-3 md:grid-cols-4"><div className="flex gap-2"><select value={selectedRole} onChange={(e)=>setSelectedRole(e.target.value as typeof role)} className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"><option value="client">عميل</option><option value="freelancer">مستقل</option><option value="admin">مشرف</option></select><button disabled={pending} onClick={()=>run(()=>updateUserRole(userId, selectedRole))} className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white">حفظ</button></div><button disabled={pending} onClick={()=>run(()=>toggleUserActive(userId))} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">{isActive?'تعطيل':'تفعيل'}</button><ResetPasswordButton userId={userId}/><button disabled={pending} onClick={()=>{if(confirm('هل تريد حذف الحساب؟')) run(()=>deleteUser(userId), true)}} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">حذف الحساب</button></div>{toast && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{toast}</div>}</section>;
}
