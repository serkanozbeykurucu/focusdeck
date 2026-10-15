import { create } from 'zustand';
import type { Flashcard, SessionSummary, StudySession } from '../types';
import { flashcardsApi, reviewsApi, sessionsApi } from '../services/api';

interface SessionState {
  session: StudySession | null;
  cards: Flashcard[];
  index: number;
  revealed: boolean;
  loading: boolean;
  summary: SessionSummary | null;
  error: string | null;
  start: (opts: {
    documentId: string;
    pomodoroEnabled: boolean;
    pomodoroMinutes: number;
  }) => Promise<void>;
  reveal: () => void;
  rate: (quality: number) => Promise<void>;
  end: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  cards: [],
  index: 0,
  revealed: false,
  loading: false,
  summary: null,
  error: null,

  reset: () =>
    set({
      session: null,
      cards: [],
      index: 0,
      revealed: false,
      loading: false,
      summary: null,
      error: null,
    }),

  start: async ({ documentId, pomodoroEnabled, pomodoroMinutes }) => {
    set({ loading: true, error: null, summary: null });
    try {
      const [{ data: sessionData }, { data: dueData }] = await Promise.all([
        sessionsApi.start({ pomodoroEnabled, pomodoroMinutes }),
        flashcardsApi.due(documentId, 20),
      ]);
      set({
        session: sessionData.session,
        cards: dueData.flashcards,
        index: 0,
        revealed: false,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to start session',
      });
      throw err;
    }
  },

  reveal: () => set({ revealed: true }),

  rate: async (quality) => {
    const { session, cards, index } = get();
    if (!session || !cards[index]) return;

    await reviewsApi.create({
      flashcardId: cards[index].id,
      quality,
      sessionId: session.id,
    });

    const nextIndex = index + 1;
    set({
      index: nextIndex,
      revealed: false,
      session: { ...session, cardsReviewed: session.cardsReviewed + 1 },
    });

    if (nextIndex >= cards.length) {
      await get().end();
    }
  },

  end: async () => {
    const { session } = get();
    if (!session) return;
    const { data } = await sessionsApi.end(session.id);
    set({
      session: data.session,
      summary: data.summary,
      cards: [],
      index: 0,
      revealed: false,
    });
  },
}));
