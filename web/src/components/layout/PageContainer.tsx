import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {(title || actions) && (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h1 className="font-display text-2xl text-ink md:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </main>
  );
}
