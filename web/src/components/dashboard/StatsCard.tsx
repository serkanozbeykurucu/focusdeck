import { ReactNode } from 'react';
import { Card } from '../ui/Card';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}

export function StatsCard({ label, value, hint, icon }: Props) {
  return (
    <Card className="flex items-start gap-3">
      {icon && <div className="rounded-md bg-accent-soft p-2 text-accent-dark">{icon}</div>}
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="mt-0.5 font-display text-2xl text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      </div>
    </Card>
  );
}
