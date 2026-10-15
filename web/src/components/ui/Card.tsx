import { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-surface-border bg-white p-5 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
