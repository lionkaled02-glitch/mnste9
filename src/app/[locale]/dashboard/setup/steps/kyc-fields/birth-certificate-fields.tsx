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

export function BirthCertificateFields({ disabled, errors = {} }: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[#2386c8]/10 bg-[#2386c8]/[0.03] p-4 sm:grid-cols-2">
      <Field name="fullName" label="الاسم الكامل (كما في البطاقة)" disabled={disabled} error={errors.fullName?.[0]} />
      <Field name="cardNumber" label="رقم البطاقة" disabled={disabled} error={errors.cardNumber?.[0]} placeholder="8-20 رقماً" />
      <Field name="issueYear" label="سنة الإصدار" type="number" disabled={disabled} error={errors.issueYear?.[0]} placeholder="2024" />
      <Field name="issuePlace" label="مكان الإصدار (المحافظة)" disabled={disabled} error={errors.issuePlace?.[0]} />
    </div>
  );
}
