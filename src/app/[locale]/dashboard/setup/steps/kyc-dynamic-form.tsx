'use client';

import { useMemo, useState } from 'react';

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
  national_id: {
    front: 'الوجه الأمامي (صورة)',
    back: 'الوجه الخلفي (صورة)',
    selfie: 'سيلفي مع البطاقة',
  },
  passport: {
    front: 'صفحة البيانات (صورة)',
    back: 'صفحة التأشيرات (اختيارية)',
    selfie: 'سيلفي مع الجواز',
    backOptional: true,
  },
  driving_license: {
    front: 'الوجه الأمامي (صورة)',
    back: 'الوجه الخلفي (صورة)',
    selfie: 'سيلفي مع الرخصة',
  },
};

function FileField({ name, label, required, error, disabled }: { name: string; label: string; required: boolean; error?: string; disabled?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label htmlFor={`kyc-${name}`} className="block text-xs font-bold text-slate-800">{label}</label>
      <input
        id={`kyc-${name}`}
        name={name}
        type="file"
        required={required}
        accept={KYC_ALLOWED_MIME_TYPES.join(',')}
        disabled={disabled}
        className="mt-3 w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#2386c8]/10 file:px-3 file:py-2 file:font-bold file:text-[#2386c8]"
      />
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
        <select
          id="setup-kyc-type"
          name="documentType"
          required
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as DynamicDocumentType)}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${errors.documentType?.[0] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
        >
          {DOCUMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {errors.documentType?.[0] && <p className="mt-2 text-xs text-red-600">{errors.documentType[0]}</p>}
      </div>

      {documentType === 'national_id' && <BirthCertificateFields disabled={disabled} errors={errors} />}
      {documentType === 'passport' && <PassportFields disabled={disabled} errors={errors} />}
      {documentType === 'driving_license' && <DrivingLicenseFields disabled={disabled} errors={errors} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <FileField name="frontDocument" label={fileLabels.front} required disabled={disabled} error={errors.frontDocument?.[0]} />
        <FileField name="backDocument" label={fileLabels.back} required={!fileLabels.backOptional} disabled={disabled} error={errors.backDocument?.[0]} />
        <FileField name="selfieDocument" label={fileLabels.selfie} required disabled={disabled} error={errors.selfieDocument?.[0]} />
      </div>
    </div>
  );
}
