import { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input id={inputId} className={`input ${className}`} {...rest} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
