'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { KYC_ALLOWED_MIME_TYPES } from '@/lib/services/kyc-meta';

import { BirthCertificateFields } from './kyc-fields/birth-certificate-fields';
import { DrivingLicenseFields } from './kyc-fields/driving-license-fields';
import { PassportFields } from './kyc-fields/passport-fields';

export type DynamicDocumentType = 'national_id' | 'passport' | 'driving_license';

export interface KycFiles {
  frontDocument: File | null;
  backDocument: File | null;
  selfieDocument: File | null;
}

interface KycDynamicFormProps {
  disabled?: boolean;
  errors?: Record<string, string[]>;
  onFilesChange?: (files: KycFiles) => void;
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

const ACCEPTED_IMAGE_TYPES = KYC_ALLOWED_MIME_TYPES.filter((type) => type.startsWith('image/')).join(',');

function FileField({
  name,
  label,
  required,
  disabled,
  error,
  onChange,
}: {
  name: keyof KycFiles;
  label: string;
  required: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = (file: File | undefined) => {
    if (!file) {
      onChange(null);
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreview(url);
    setFileName(file.name);
    onChange(file);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
    setFileName(null);
    onChange(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="mb-3 block text-xs font-bold text-slate-800">
        {label}
        {required ? <span className="ms-1 text-red-500">*</span> : <span className="ms-1 text-slate-400">(اختياري)</span>}
      </label>

      {preview ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={fileName ?? label} className="h-36 w-full rounded-xl object-cover ring-1 ring-slate-200" />
          <p className="truncate text-xs text-slate-500">{fileName}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="rounded-xl border border-[#2386c8]/30 bg-[#2386c8]/5 p-3 text-center text-xs font-bold text-[#2386c8] hover:bg-[#2386c8]/10 disabled:opacity-60"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              حذف
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-start hover:border-[#2386c8]/50 hover:bg-slate-100 disabled:opacity-60"
        >
          <span className="text-2xl">🖼️</span>
          <span>
            <span className="block text-sm font-bold text-slate-700">اختيار من المعرض</span>
            <span className="block text-xs text-slate-500">ارفع صورة واضحة من جهازك</span>
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function KycDynamicForm({ disabled, errors = {}, onFilesChange }: KycDynamicFormProps) {
  const [documentType, setDocumentType] = useState<DynamicDocumentType>('national_id');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const fileLabels = FILE_LABELS[documentType];
  const extraFieldsJson = useMemo(() => JSON.stringify({ documentType }), [documentType]);

  useEffect(() => {
    onFilesChange?.({
      frontDocument: frontFile,
      backDocument: backFile,
      selfieDocument: selfieFile,
    });
  }, [frontFile, backFile, selfieFile, onFilesChange]);

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
        <FileField name="frontDocument" label={fileLabels.front} required disabled={disabled} error={errors.frontDocument?.[0] ?? errors.frontFile?.[0]} onChange={setFrontFile} />
        <FileField name="backDocument" label={fileLabels.back} required={!fileLabels.backOptional} disabled={disabled} error={errors.backDocument?.[0] ?? errors.backFile?.[0]} onChange={setBackFile} />
        <FileField name="selfieDocument" label={fileLabels.selfie} required disabled={disabled} error={errors.selfieDocument?.[0] ?? errors.selfieFile?.[0]} onChange={setSelfieFile} />
      </div>
    </div>
  );
}
