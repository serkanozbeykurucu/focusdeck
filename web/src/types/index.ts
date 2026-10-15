export type PromptStrategy = 'ZERO_SHOT' | 'FEW_SHOT' | 'BLOOM_BASED';
export type BloomLevel = 'REMEMBERING' | 'UNDERSTANDING' | 'APPLYING' | 'ANALYZING';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  originalFilename: string;
  wordCount: number;
  uploadedAt: string;
  flashcardCount: number;
}

export interface Document extends DocumentSummary {
  extractedText?: string;
}

export interface Flashcard {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  promptStrategy: PromptStrategy;
  bloomLevel: BloomLevel | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  pomodoroEnabled: boolean;
  pomodoroMinutes: number;
  cardsReviewed: number;
}

export interface SessionSummary {
  cardsReviewed: number;
  ratingDistribution: {
    again: number;
    hard: number;
    good: number;
    easy: number;
    other: number;
  };
  retentionEstimate: number;
  durationMinutes: number;
}

export interface ActivityStats {
  cardsDue: number;
  cardsPerDay: { date: string; count: number }[];
  cardsPerDocument: { documentId: string; title: string; count: number }[];
  recentActivity: {
    id: string;
    quality: number;
    reviewedAt: string;
    question: string;
  }[];
  recentSessions: StudySession[];
}

export interface RetentionPoint {
  date: string;
  total: number;
  success: number;
  rate: number;
}
