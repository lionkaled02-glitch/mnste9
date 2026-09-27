'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { approveWithdrawal } from '@/app/actions/admin';
export function ApproveWithdrawalButton({ withdrawalId }: { withdrawalId: number }) { const router=useRouter(); const [pending,startTransition]=useTransition(); const [toast,setToast]=useState(''); return <>{toast&&<span className="text-xs font-bold text-emerald-700">{toast}</span>}<button disabled={pending} onClick={()=>startTransition(async()=>{const r=await approveWithdrawal(withdrawalId); setToast(r.message??'تم'); router.refresh();})} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">موافقة</button></>; }
