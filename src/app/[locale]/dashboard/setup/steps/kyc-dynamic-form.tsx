'use client';

import { useMemo, useRef, useState } from 'react';

import { KYC_ALLOWED_MIME_TYPES } from '@/lib/services/kyc-meta';

import { BirthCertificateFields } from './kyc-fields/birth-certificate-fields';
import { DrivingLicenseFields } from './kyc-fields/driving-license-fields';
import { PassportFields } from './kyc-fields/passport-fields';

export type DynamicDocumentType = 'national_id' | 'passport' | 'driving_license';

interface KycDynamicFormProps {
  disabled?: boolean;
  errors?: Record<string, string[]>;
}

const DOCUMENT_TYPES: { value: DynamicDocumentType; label: string }[] = [
  { value: 'national_id', label: 'بطاقة شخصية' },
  { value: 'passport', label: 'جواز سفر' },
  { value: 'driving_license', label: 'رخصة قيادة' },
];

const FILE_LABELS: Record<DynamicDocumentType, { front: string; back: string; selfie: string; backOptional?: boolean }> = {
  national_id: { front: 'الوجه الأمامي (صورة)', back: 'الوجه الخلفي (صورة)', selfie: 'سيلفي مع البطاقة' },
  passport: { front: 'صفحة البيانات (صورة)', back: 'صفحة التأشيرات (اختيارية)', selfie: 'سيلفي مع الجواز', backOptional: true },
  driving_license: { front: 'الوجه الأمامي (صورة)', back: 'الوجه الخلفي (صورة)', selfie: 'سيلفي مع الرخصة' },
};

function FileField({ name, alias, label, required, error, disabled, selfie = false }: { name: string; alias: string; label: string; required: boolean; error?: string; disabled?: boolean; selfie?: boolean }) {
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
    setPreview(null);
    setFileName(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800">{label}</label>
        {preview && <button type="button" onClick={clear} className="text-xs font-bold text-red-600">حذف</button>}
      </div>

      {preview ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={fileName ?? label} className="h-36 w-full rounded-xl object-cover ring-1 ring-slate-200" />
          <p className="truncate text-xs text-slate-500">{fileName}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="cursor-pointer rounded-xl border border-[#2386c8]/30 bg-[#2386c8]/5 p-3 text-center text-xs font-bold text-[#2386c8] hover:bg-[#2386c8]/10">
              تغيير بالكاميرا
              <input ref={cameraRef} name={name} type="file" accept="image/*" capture={selfie ? 'user' : 'environment'} disabled={disabled} required={required && !preview} onChange={(event) => handleFile(event.target.files?.[0])} className="hidden" />
            </label>
            <label className="cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-100">
              تغيير من المعرض
              <input ref={galleryRef} name={alias} type="file" accept={KYC_ALLOWED_MIME_TYPES.join(',')} disabled={disabled} required={required && !preview} onChange={(event) => handleFile(event.target.files?.[0])} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#2386c8]/30 bg-[#2386c8]/5 p-4 hover:border-[#2386c8] hover:bg-[#2386c8]/10">
            <input ref={cameraRef} name={name} type="file" accept="image/*" capture={selfie ? 'user' : 'environment'} disabled={disabled} required={required} onChange={(event) => handleFile(event.target.files?.[0])} className="hidden" />
            <span className="text-2xl">📷</span>
            <span><span className="block text-sm font-bold text-[#2386c8]">التقاط بالكاميرا</span><span className="block text-xs text-slate-500">التقط صورة الآن</span></span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 hover:border-[#2386c8]/50 hover:bg-slate-100">
            <input ref={galleryRef} name={alias} type="file" accept={KYC_ALLOWED_MIME_TYPES.join(',')} disabled={disabled} required={required} onChange={(event) => handleFile(event.target.files?.[0])} className="hidden" />
            <span className="text-2xl">🖼️</span>
            <span><span className="block text-sm font-bold text-slate-700">اختيار من المعرض</span><span className="block text-xs text-slate-500">صورة موجودة</span></span>
          </label>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function KycDynamicForm({ disabled, errors = {} }: KycDynamicFormProps) {
  const [documentType, setDocumentType] = useState<DynamicDocumentType>('national_id');
  const fileLabels = FILE_LABELS[documentType];
  const extraFieldsJson = useMemo(() => JSON.stringify({ documentType }), [documentType]);

  return (
    <div className="space-y-5">
      <input type="hidden" name="extraFields" value={extraFieldsJson} readOnly />
      <div>
        <label htmlFor="setup-kyc-type" className="mb-2 block text-sm font-bold text-slate-800">نوع الوثيقة</label>
        <select id="setup-kyc-type" name="documentType" required value={documentType} onChange={(event) => setDocumentType(event.target.value as DynamicDocumentType)} disabled={disabled} className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${errors.documentType?.[0] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}>
          {DOCUMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {errors.documentType?.[0] && <p className="mt-2 text-xs text-red-600">{errors.documentType[0]}</p>}
      </div>

      {documentType === 'national_id' && <BirthCertificateFields disabled={disabled} errors={errors} />}
      {documentType === 'passport' && <PassportFields disabled={disabled} errors={errors} />}
      {documentType === 'driving_license' && <DrivingLicenseFields disabled={disabled} errors={errors} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <FileField name="frontDocument" alias="frontFile" label={fileLabels.front} required disabled={disabled} error={errors.frontDocument?.[0] ?? errors.frontFile?.[0]} />
        <FileField name="backDocument" alias="backFile" label={fileLabels.back} required={!fileLabels.backOptional} disabled={disabled} error={errors.backDocument?.[0] ?? errors.backFile?.[0]} />
        <FileField name="selfieDocument" alias="selfieFile" label={fileLabels.selfie} required disabled={disabled} selfie error={errors.selfieDocument?.[0] ?? errors.selfieFile?.[0]} />
      </div>
    </div>
  );
}
