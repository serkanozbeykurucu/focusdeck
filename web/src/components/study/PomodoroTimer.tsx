import { useEffect } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const phaseLabel = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
} as const;

interface Props {
  pauseOnUnmount?: boolean;
}

export function PomodoroTimer({ pauseOnUnmount = true }: Props) {
  const {
    enabled,
    secondsLeft,
    phase,
    cycle,
    running,
    start,
    pause,
    reset,
  } = useTimerStore();

  useEffect(() => {
    return () => {
      if (pauseOnUnmount) pause();
    };
  }, [pauseOnUnmount, pause]);

  if (!enabled) return null;

  return (
    <div className="rounded-lg border border-surface-border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {phaseLabel[phase]} · cycle {cycle}
          </p>
          <p className="font-display text-2xl tabular-nums text-ink">{formatTime(secondsLeft)}</p>
        </div>
        <div className="flex items-center gap-1">
          {running ? (
            <button type="button" className="btn-ghost p-2" onClick={pause} aria-label="Pause">
              <Pause size={18} />
            </button>
          ) : (
            <button type="button" className="btn-ghost p-2" onClick={start} aria-label="Start">
              <Play size={18} />
            </button>
          )}
          <button type="button" className="btn-ghost p-2" onClick={reset} aria-label="Reset">
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
