import { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { RetentionChart } from '../components/dashboard/RetentionChart';
import { statsApi } from '../services/api';
import type { ActivityStats, RetentionPoint } from '../types';

export function Stats() {
  const [retention, setRetention] = useState<RetentionPoint[]>([]);
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [ret, act] = await Promise.all([statsApi.retention(), statsApi.activity()]);
        setRetention(ret.data.retention);
        setActivity(act.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      }
    })();
  }, []);

  const maxDay = Math.max(1, ...(activity?.cardsPerDay.map((d) => d.count) ?? [1]));

  return (
    <PageContainer
      title="Statistics"
      subtitle="Retention over time and review volume for your thesis experiment logs."
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-lg text-ink">Retention over time</h2>
          <RetentionChart data={retention} />
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-lg text-ink">Cards reviewed per day</h2>
          {!activity?.cardsPerDay.length ? (
            <p className="py-8 text-center text-sm text-ink-muted">No review activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.cardsPerDay.slice(-14).map((d) => (
                <li key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-ink-faint">{d.date}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(d.count / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-ink">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-display text-lg text-ink">Cards per document</h2>
          {!activity?.cardsPerDocument.length ? (
            <p className="text-sm text-ink-muted">No documents.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted">
                    <th className="pb-2 font-medium">Document</th>
                    <th className="pb-2 font-medium">Flashcards</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.cardsPerDocument.map((d) => (
                    <tr key={d.documentId} className="border-b border-surface-border/60">
                      <td className="py-2.5 text-ink">{d.title}</td>
                      <td className="py-2.5 tabular-nums text-ink">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
