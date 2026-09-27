'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { resolveContractDispute } from '@/app/actions/admin';
export function ResolveDisputeButton({ contractId }: { contractId: number }) { const router=useRouter(); const [pending,startTransition]=useTransition(); return <button disabled={pending} onClick={()=>{if(confirm('تأكيد حل النزاع؟')) startTransition(async()=>{await resolveContractDispute(contractId); router.refresh();});}} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">حل النزاع</button> }
