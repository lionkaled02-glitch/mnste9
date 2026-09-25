'use client';

import { useRef, useState, useTransition } from 'react';

import { createSetupPortfolioWorkAction } from '@/app/actions/setup';

import type { LocalPortfolioWork } from './portfolio-work-card';

interface PortfolioWorkFormProps {
  onCreated: (work: LocalPortfolioWork, portfolioCount: number) => void;
}

interface FormErrors {
  [key: string]: string[] | undefined;
}

async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await fetch('/api/upload/portfolio-image', { method: 'POST', body: formData });
  const data = (await response.json()) as { urls?: string[]; error?: string };
  if (!response.ok || !data.urls) throw new Error(data.error ?? 'تعذر رفع الصور');
  return data.urls;
}

async function uploadAttachment(file: File | null): Promise<{ url: string; name: string }> {
  if (!file) return { url: '', name: '' };
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload/portfolio-file', { method: 'POST', body: formData });
  const data = (await response.json()) as { url?: string; name?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? 'تعذر رفع الملف');
  return { url: data.url, name: data.name ?? file.name };
}

export function PortfolioWorkForm({ onCreated }: PortfolioWorkFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setErrors({});
    setMessage(null);

    startTransition(async () => {
      try {
        const imageFiles = formData.getAll('images').filter((file): file is File => file instanceof File && file.size > 0);
        const attachmentFile = formData.get('attachment');
        const attachment = attachmentFile instanceof File && attachmentFile.size > 0 ? attachmentFile : null;

        if (imageFiles.length < 3) {
          setErrors({ images: ['الحد الأدنى 3 صور لكل عمل'] });
          return;
        }
        if (imageFiles.length > 10) {
          setErrors({ images: ['الحد الأقصى 10 صور لكل عمل'] });
          return;
        }

        const [imageUrls, attachmentUrl] = await Promise.all([uploadImages(imageFiles), uploadAttachment(attachment)]);
        const actionData = new FormData();
        actionData.set('title', String(formData.get('title') ?? ''));
        actionData.set('description', String(formData.get('description') ?? ''));
        actionData.set('externalUrl', String(formData.get('externalUrl') ?? ''));
        actionData.set('imageUrls', JSON.stringify(imageUrls));
        actionData.set('attachmentUrl', attachmentUrl.url);
        actionData.set('attachmentName', attachmentUrl.name);

        const result = await createSetupPortfolioWorkAction(actionData);
        if (!result.success) {
          setErrors(result.fieldErrors ?? {});
          setMessage(result.message ?? 'تعذر حفظ العمل');
          return;
        }

        onCreated(
          {
            id: `${Date.now()}`,
            title: String(formData.get('title') ?? ''),
            description: String(formData.get('description') ?? ''),
            coverUrl: result.coverUrl ?? imageUrls[0],
            imagesCount: imageUrls.length,
            attachmentUrl: attachmentUrl.url || undefined,
          },
          result.portfolioCount ?? 0,
        );
        formRef.current?.reset();
        setMessage(result.message ?? 'تمت إضافة العمل');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      }
    });
  };

  return (
    <form ref={formRef} action={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="work-title" className="mb-1.5 block text-xs font-bold text-slate-700">عنوان العمل</label>
          <input id="work-title" name="title" required minLength={3} maxLength={200} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20" />
          {errors.title?.[0] && <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>}
        </div>
        <div>
          <label htmlFor="work-url" className="mb-1.5 block text-xs font-bold text-slate-700">رابط خارجي (اختياري)</label>
          <input id="work-url" name="externalUrl" type="url" dir="ltr" maxLength={500} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20" />
          {errors.externalUrl?.[0] && <p className="mt-1 text-xs text-red-600">{errors.externalUrl[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="work-description" className="mb-1.5 block text-xs font-bold text-slate-700">وصف العمل</label>
        <textarea id="work-description" name="description" required minLength={20} maxLength={2000} rows={4} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20" />
        {errors.description?.[0] && <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="work-images" className="mb-1.5 block text-xs font-bold text-slate-700">صور العمل (3 على الأقل، حتى 10)</label>
          <input id="work-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#2386c8]/10 file:px-3 file:py-2 file:font-bold file:text-[#2386c8]" />
          {errors.images?.[0] && <p className="mt-1 text-xs text-red-600">{errors.images[0]}</p>}
          {errors.imageUrls?.[0] && <p className="mt-1 text-xs text-red-600">{errors.imageUrls[0]}</p>}
        </div>
        <div>
          <label htmlFor="work-attachment" className="mb-1.5 block text-xs font-bold text-slate-700">ملف مرفق (اختياري)</label>
          <input id="work-attachment" name="attachment" type="file" accept="application/pdf,application/zip,application/x-zip-compressed,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs file:me-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-bold file:text-slate-700" />
          {errors.attachmentUrl?.[0] && <p className="mt-1 text-xs text-red-600">{errors.attachmentUrl[0]}</p>}
        </div>
      </div>

      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">{message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الرفع والحفظ…' : 'أضف عمل جديد'}
      </button>
    </form>
  );
}
