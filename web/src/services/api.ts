import axios from 'axios';
import type {
  ActivityStats,
  Document,
  DocumentSummary,
  Flashcard,
  PromptStrategy,
  RetentionPoint,
  SessionSummary,
  StudySession,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('focusdeck_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ?? err.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    api.post<{ token: string; user: User }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

export const documentsApi = {
  list: () => api.get<{ documents: DocumentSummary[] }>('/documents'),
  get: (id: string) => api.get<{ document: Document }>(`/documents/${id}`),
  delete: (id: string) => api.delete(`/documents/${id}`),
  upload: (file: File, title: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    return api.post<{ document: Document }>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateFlashcards: (
    id: string,
    strategy: PromptStrategy,
    numQuestions = 10
  ) =>
    api.post<{ flashcards: Flashcard[]; count: number }>(
      `/documents/${id}/generate-flashcards`,
      { strategy, numQuestions }
    ),
  listFlashcards: (id: string) =>
    api.get<{ flashcards: Flashcard[] }>(`/documents/${id}/flashcards`),
};

export const flashcardsApi = {
  due: (documentId: string, limit = 20) =>
    api.get<{ flashcards: Flashcard[]; count: number }>('/flashcards/due', {
      params: { documentId, limit },
    }),
};

export const reviewsApi = {
  create: (data: { flashcardId: string; quality: number; sessionId?: string }) =>
    api.post('/reviews', data),
  list: (from?: string, to?: string) =>
    api.get('/reviews', { params: { from, to } }),
};

export const sessionsApi = {
  start: (data?: { pomodoroEnabled?: boolean; pomodoroMinutes?: number }) =>
    api.post<{ session: StudySession }>('/sessions/start', data ?? {}),
  end: (id: string) =>
    api.post<{ session: StudySession; summary: SessionSummary }>(
      `/sessions/${id}/end`
    ),
  list: () => api.get<{ sessions: StudySession[] }>('/sessions'),
};

export const statsApi = {
  retention: () => api.get<{ retention: RetentionPoint[] }>('/stats/retention'),
  activity: () => api.get<ActivityStats>('/stats/activity'),
};
