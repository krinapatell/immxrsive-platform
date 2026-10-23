'use client';

/**
 * A labelled text field that shows its own error message and links it with
 * aria-describedby, so screen readers announce what needs fixing (R2.27).
 */
export default function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  multiline = false,
  required = false,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: id,
    value,
    required,
    maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: `mt-1 w-full rounded-lg border px-3 py-2 ${error ? 'border-red-600' : 'border-line'}`,
  } as const;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea {...common} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
