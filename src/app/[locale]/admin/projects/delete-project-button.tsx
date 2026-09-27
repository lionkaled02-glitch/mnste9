'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteProject, disableProject } from '@/app/actions/admin';
export function DeleteProjectButton({ projectId, mode='delete' }: { projectId: number; mode?: 'delete' | 'disable' }) { const router=useRouter(); const [pending,startTransition]=useTransition(); const isDelete=mode==='delete'; return <button disabled={pending} onClick={()=>{if(confirm(isDelete?'هل تريد حذف المشروع؟':'هل تريد تعطيل المشروع؟')) startTransition(async()=>{await (isDelete?deleteProject(projectId):disableProject(projectId)); router.refresh();});}} className={isDelete?'rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50':'rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50'}>{isDelete?'حذف':'تعطيل'}</button> }
