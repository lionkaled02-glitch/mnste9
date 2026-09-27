'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { approveKycAction } from '@/app/actions/admin';
export function QuickApproveButton({ kycId }: { kycId: number }) { const router=useRouter(); const [pending,startTransition]=useTransition(); return <button disabled={pending} onClick={()=>{if(confirm('موافقة سريعة على الطلب؟')) startTransition(async()=>{const fd=new FormData(); fd.set('id', String(kycId)); await approveKycAction(fd); router.refresh();});}} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">موافقة سريعة</button> }
