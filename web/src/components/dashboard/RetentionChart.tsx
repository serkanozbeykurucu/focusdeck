import type { RetentionPoint } from '../../types';

interface Props {
  data: RetentionPoint[];
}

export function RetentionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No review data yet. Complete a study session to see retention over time.
      </p>
    );
  }

  const maxRate = 100;
  const width = 560;
  const height = 180;
  const pad = 24;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - (d.rate / maxRate) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[320px]">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e2e8f0" />
        <polyline
          fill="none"
          stroke="#0d9488"
          strokeWidth="2.5"
          points={points.join(' ')}
        />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
          const y = height - pad - (d.rate / maxRate) * (height - pad * 2);
          return <circle key={d.date} cx={x} cy={y} r="3.5" fill="#0f766e" />;
        })}
        <text x={pad} y={14} className="fill-ink-faint text-[10px]">
          Retention %
        </text>
      </svg>
      <div className="mt-2 flex justify-between text-xs text-ink-faint">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
