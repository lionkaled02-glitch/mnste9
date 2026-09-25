'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';

import { createSetupPortfolioWorkAction } from '@/app/actions/setup';

import type { LocalPortfolioWork } from './portfolio-work-card';

interface PortfolioWorkFormProps {
  onCreated: (work: LocalPortfolioWork, portfolioCount: number) => void;
}

interface FormErrors {
  [key: string]: string[] | undefined;
}

interface PreviewImage {
  id: string;
  file: File;
  url: string;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImagesRef = useRef<File[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const replacePreviews = (next: PreviewImage[]) => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = next.map((item) => item.url);
    setPreviews(next);
  };

  const chooseImages = (files: FileList | null) => {
    const selected = Array.from(files ?? []).filter((file) => file.size > 0).slice(0, 10);
    selectedImagesRef.current = selected;
    const next = selected.map((file) => ({ id: `${file.name}-${file.size}-${crypto.randomUUID()}`, file, url: URL.createObjectURL(file) }));
    replacePreviews(next);
    setErrors((prev) => ({ ...prev, images: undefined, imageUrls: undefined }));
  };

  const removeImage = (id: string) => {
    const next = previews.filter((item) => item.id !== id);
    selectedImagesRef.current = next.map((item) => item.file);
    replacePreviews(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    // React 19 قد يفرّغ/يفقد ملفات FormData عند استخدام <form action> مع startTransition.
    // لذلك نستخدم onSubmit ونقرأ الملفات المحفوظة فوراً من ref قبل بدء transition.
    const formData = new FormData(event.currentTarget);
    const imageFiles = selectedImagesRef.current.filter((file) => file.size > 0);
    const attachmentFile = formData.get('attachment');
    const attachment = attachmentFile instanceof File && attachmentFile.size > 0 ? attachmentFile : null;
    const title = String(formData.get('title') ?? '');
    const description = String(formData.get('description') ?? '');
    const externalUrl = String(formData.get('externalUrl') ?? '');

    if (imageFiles.length < 3) {
      setErrors({ images: ['الحد الأدنى 3 صور لكل عمل'] });
      return;
    }
    if (imageFiles.length > 10) {
      setErrors({ images: ['الحد الأقصى 10 صور لكل عمل'] });
      return;
    }

    startTransition(async () => {
      try {
        const [imageUrls, attachmentUrl] = await Promise.all([uploadImages(imageFiles), uploadAttachment(attachment)]);

        if (imageUrls.length < 3) {
          setErrors({ imageUrls: ['لم يتم رفع كل الصور — أعد اختيار 3 صور على الأقل'] });
          return;
        }

        const actionData = new FormData();
        actionData.set('title', title);
        actionData.set('description', description);
        actionData.set('externalUrl', externalUrl);
        actionData.set('imageUrls', JSON.stringify(imageUrls));
        actionData.set('attachmentUrl', attachmentUrl.url);
        actionData.set('attachmentName', attachmentUrl.name);

        const result = await createSetupPortfolioWorkAction(actionData);
        if (!result.success) {
          setErrors(result.fieldErrors ?? {});
          setMessage(result.message ?? 'تعذر حفظ العمل');
          return;
        }

        onCreated({ id: `${Date.now()}`, title, description, coverUrl: result.coverUrl ?? imageUrls[0], imagesCount: imageUrls.length, attachmentUrl: attachmentUrl.url || undefined }, result.portfolioCount ?? 0);
        formRef.current?.reset();
        selectedImagesRef.current = [];
        replacePreviews([]);
        setMessage(result.message ?? 'تمت إضافة العمل');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
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
          <input ref={fileInputRef} id="work-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => chooseImages(event.target.files)} className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#2386c8]/10 file:px-3 file:py-2 file:font-bold file:text-[#2386c8]" />
          {errors.images?.[0] && <p className="mt-1 text-xs text-red-600">{errors.images[0]}</p>}
          {errors.imageUrls?.[0] && <p className="mt-1 text-xs text-red-600">{errors.imageUrls[0]}</p>}
        </div>
        <div>
          <label htmlFor="work-attachment" className="mb-1.5 block text-xs font-bold text-slate-700">ملف مرفق (اختياري)</label>
          <input id="work-attachment" name="attachment" type="file" accept="application/pdf,application/zip,application/x-zip-compressed,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs file:me-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-bold file:text-slate-700" />
          {errors.attachmentUrl?.[0] && <p className="mt-1 text-xs text-red-600">{errors.attachmentUrl[0]}</p>}
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {previews.map((item, index) => (
            <div key={item.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.file.name} className="h-28 w-full object-cover" />
              {index === 0 && <span className="absolute right-2 top-2 rounded-full bg-[#2386c8] px-2 py-0.5 text-[10px] font-bold text-white">الغلاف</span>}
              <button type="button" onClick={() => removeImage(item.id)} className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-red-600">حذف</button>
            </div>
          ))}
        </div>
      )}

      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">{message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الرفع والحفظ…' : 'أضف عمل جديد'}
      </button>
    </form>
  );
}
