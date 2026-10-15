import { create } from 'zustand';

export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';

interface TimerState {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  secondsLeft: number;
  phase: TimerPhase;
  cycle: number;
  running: boolean;
  enabled: boolean;
  tickId: number | null;
  setEnabled: (enabled: boolean) => void;
  setDurations: (work: number, shortBreak: number, longBreak?: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  advancePhase: () => void;
}

function phaseSeconds(state: Pick<TimerState, 'phase' | 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'>): number {
  if (state.phase === 'work') return state.workMinutes * 60;
  if (state.phase === 'shortBreak') return state.shortBreakMinutes * 60;
  return state.longBreakMinutes * 60;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  secondsLeft: 25 * 60,
  phase: 'work',
  cycle: 0,
  running: false,
  enabled: false,
  tickId: null,

  setEnabled: (enabled) => set({ enabled }),

  setDurations: (work, shortBreak, longBreak = 15) => {
    const next = {
      workMinutes: work,
      shortBreakMinutes: shortBreak,
      longBreakMinutes: longBreak,
    };
    set({
      ...next,
      secondsLeft: get().running ? get().secondsLeft : work * 60,
    });
  },

  start: () => {
    if (get().tickId !== null) return;
    const id = window.setInterval(() => get().tick(), 1000);
    set({ running: true, tickId: id });
  },

  pause: () => {
    const id = get().tickId;
    if (id !== null) window.clearInterval(id);
    set({ running: false, tickId: null });
  },

  reset: () => {
    get().pause();
    set({
      phase: 'work',
      cycle: 0,
      secondsLeft: get().workMinutes * 60,
    });
  },

  tick: () => {
    const { secondsLeft } = get();
    if (secondsLeft <= 1) {
      get().advancePhase();
      return;
    }
    set({ secondsLeft: secondsLeft - 1 });
  },

  advancePhase: () => {
    const state = get();
    let phase: TimerPhase = state.phase;
    let cycle = state.cycle;

    if (phase === 'work') {
      cycle += 1;
      phase = cycle % 4 === 0 ? 'longBreak' : 'shortBreak';
    } else {
      phase = 'work';
    }

    const next = { ...state, phase, cycle };
    set({
      phase,
      cycle,
      secondsLeft: phaseSeconds(next),
    });

    try {
      const audio = new Audio('/chime.wav');
      void audio.play().catch(() => undefined);
    } catch {
      // ignore
    }
  },
}));
