import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Layers } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityList } from '../components/dashboard/ActivityList';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';
import { statsApi, documentsApi } from '../services/api';
import type { ActivityStats, DocumentSummary } from '../types';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [act, docs] = await Promise.all([statsApi.activity(), documentsApi.list()]);
        setActivity(act.data);
        setDocuments(docs.data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    })();
  }, []);

  const studyTarget = documents.find((d) => d.flashcardCount > 0);

  return (
    <PageContainer
      title={`Welcome, ${user?.name?.split(' ')[0] ?? 'student'}`}
      subtitle="Review due cards, or upload material to generate flashcards."
      actions={
        studyTarget ? (
          <Link to={`/study/${studyTarget.id}`}>
            <Button>Study now</Button>
          </Link>
        ) : (
          <Link to="/upload">
            <Button>Upload material</Button>
          </Link>
        )
      }
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Cards due"
          value={activity?.cardsDue ?? '—'}
          icon={<Clock size={18} />}
          hint="Ready for review"
        />
        <StatsCard
          label="Documents"
          value={documents.length}
          icon={<BookOpen size={18} />}
        />
        <StatsCard
          label="Total flashcards"
          value={documents.reduce((n, d) => n + d.flashcardCount, 0)}
          icon={<Layers size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg text-ink">Recent activity</h2>
          <ActivityList items={activity?.recentActivity ?? []} />
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Your documents</h2>
            <Link to="/documents" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No documents yet.{' '}
              <Link to="/upload" className="text-accent hover:underline">
                Upload one
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {documents.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{d.title}</p>
                    <p className="text-xs text-ink-faint">{d.flashcardCount} cards</p>
                  </div>
                  {d.flashcardCount > 0 && (
                    <Link to={`/study/${d.id}`}>
                      <Button variant="secondary" className="px-3 py-1.5 text-xs">
                        Study
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
