import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PomodoroTimer } from '../components/study/PomodoroTimer';
import { FlashcardViewer } from '../components/study/FlashcardViewer';
import { RatingButtons } from '../components/study/RatingButtons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import { useTimerStore } from '../stores/timerStore';
import { documentsApi } from '../services/api';

export function StudySession() {
  const { documentId } = useParams<{ documentId: string }>();
  const [docTitle, setDocTitle] = useState('');
  const [setupDone, setSetupDone] = useState(false);
  const [pomodoroOn, setPomodoroOn] = useState(true);
  const [workMin, setWorkMin] = useState(25);
  const [ratingBusy, setRatingBusy] = useState(false);

  const {
    session,
    cards,
    index,
    revealed,
    loading,
    summary,
    error,
    start,
    reveal,
    rate,
    end,
    reset,
  } = useSessionStore();

  const { setEnabled, setDurations, start: startTimer, pause, reset: resetTimer } =
    useTimerStore();

  useEffect(() => {
    reset();
    resetTimer();
    if (!documentId) return;
    void documentsApi.get(documentId).then(({ data }) => {
      setDocTitle(data.document.title);
    });
    return () => {
      pause();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function begin() {
    if (!documentId) return;
    setEnabled(pomodoroOn);
    setDurations(workMin, 5, 15);
    await start({
      documentId,
      pomodoroEnabled: pomodoroOn,
      pomodoroMinutes: workMin,
    });
    setSetupDone(true);
    if (pomodoroOn) startTimer();
  }

  async function onRate(quality: number) {
    setRatingBusy(true);
    try {
      await rate(quality);
    } finally {
      setRatingBusy(false);
    }
  }

  async function quit() {
    pause();
    await end();
  }

  if (summary) {
    return (
      <PageContainer title="Session complete" subtitle={docTitle}>
        <Card className="mx-auto max-w-lg space-y-4">
          <p className="text-ink">
            You reviewed <strong>{summary.cardsReviewed}</strong> cards in{' '}
            <strong>{summary.durationMinutes}</strong> minutes.
          </p>
          <p className="text-sm text-ink-muted">
            Estimated retention this session: <strong>{summary.retentionEstimate}%</strong>
          </p>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {(
              [
                ['Again', summary.ratingDistribution.again],
                ['Hard', summary.ratingDistribution.hard],
                ['Good', summary.ratingDistribution.good],
                ['Easy', summary.ratingDistribution.easy],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-md bg-surface-muted py-3">
                <p className="font-display text-xl text-ink">{n}</p>
                <p className="text-xs text-ink-faint">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full">Dashboard</Button>
            </Link>
            <Link to="/stats" className="flex-1">
              <Button variant="secondary" className="w-full">
                Stats
              </Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!setupDone) {
    return (
      <PageContainer title="Start study session" subtitle={docTitle || 'Loading…'}>
        <Card className="mx-auto max-w-md space-y-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pomodoroOn}
              onChange={(e) => setPomodoroOn(e.target.checked)}
            />
            Enable Pomodoro timer
          </label>
          {pomodoroOn && (
            <Input
              label="Work duration (minutes)"
              type="number"
              min={1}
              max={120}
              value={workMin}
              onChange={(e) => setWorkMin(Number(e.target.value) || 25)}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={loading || !documentId} onClick={() => void begin()}>
            {loading ? 'Loading cards…' : 'Begin session'}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const card = cards[index];
  const progress = cards.length === 0 ? 100 : Math.round((index / cards.length) * 100);

  return (
    <PageContainer>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{docTitle}</p>
          <p className="text-sm font-medium text-ink">
            Card {Math.min(index + 1, cards.length)} / {cards.length}
            {session ? ` · ${session.cardsReviewed} rated` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PomodoroTimer />
          <Button variant="ghost" onClick={() => void quit()}>
            End session
          </Button>
        </div>
      </div>

      {!card ? (
        <Card className="mx-auto max-w-md text-center">
          <p className="text-ink">No cards due for this document right now.</p>
          <Button className="mt-4" onClick={() => void quit()}>
            Finish
          </Button>
        </Card>
      ) : (
        <>
          <FlashcardViewer card={card} revealed={revealed} onReveal={reveal} />
          <div className="mt-8">
            {revealed ? (
              <RatingButtons disabled={ratingBusy} onRate={(q) => void onRate(q)} />
            ) : (
              <div className="text-center">
                <Button variant="secondary" onClick={reveal}>
                  Reveal answer
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
