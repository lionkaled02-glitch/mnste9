'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteProposal } from '@/app/actions/admin';
export function DeleteProposalButton({ proposalId }: { proposalId: number }) { const router=useRouter(); const [pending,startTransition]=useTransition(); return <button disabled={pending} onClick={()=>{if(confirm('هل تريد حذف العرض؟')) startTransition(async()=>{await deleteProposal(proposalId); router.refresh();});}} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">حذف</button> }
