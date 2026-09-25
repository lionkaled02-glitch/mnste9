interface Props {
  disabled?: boolean;
  errors?: Record<string, string[]>;
}

function Field({ name, label, type = 'text', error, disabled, placeholder }: { name: string; label: string; type?: string; error?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={`kyc-${name}`} className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>
      <input
        id={`kyc-${name}`}
        name={name}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DrivingLicenseFields({ disabled, errors = {} }: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[#2386c8]/10 bg-[#2386c8]/[0.03] p-4 sm:grid-cols-2">
      <Field name="fullName" label="الاسم الكامل" disabled={disabled} error={errors.fullName?.[0]} />
      <Field name="licenseNumber" label="رقم الرخصة" disabled={disabled} error={errors.licenseNumber?.[0]} placeholder="حروف + أرقام" />
      <Field name="issueDate" label="تاريخ الإصدار" type="date" disabled={disabled} error={errors.issueDate?.[0]} />
      <Field name="expiryDate" label="تاريخ الانتهاء" type="date" disabled={disabled} error={errors.expiryDate?.[0]} />
    </div>
  );
}
