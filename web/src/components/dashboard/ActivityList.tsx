interface Item {
  id: string;
  quality: number;
  reviewedAt: string;
  question: string;
}

const qualityLabel: Record<number, string> = {
  1: 'Again',
  3: 'Hard',
  4: 'Good',
  5: 'Easy',
};

interface Props {
  items: Item[];
}

export function ActivityList({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">No recent reviews.</p>;
  }

  return (
    <ul className="divide-y divide-surface-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{item.question}</p>
            <p className="text-xs text-ink-faint">
              {new Date(item.reviewedAt).toLocaleString()}
            </p>
          </div>
          <span className="shrink-0 rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
            {qualityLabel[item.quality] ?? item.quality}
          </span>
        </li>
      ))}
    </ul>
  );
}
