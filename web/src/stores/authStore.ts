import { create } from 'zustand';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('focusdeck_token'),
  loading: false,
  initialized: false,

  setSession: (token, user) => {
    localStorage.setItem('focusdeck_token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('focusdeck_token');
    set({ token: null, user: null });
    void authApi.logout().catch(() => undefined);
  },

  bootstrap: async () => {
    const token = get().token;
    if (!token) {
      set({ initialized: true, user: null });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data.user, initialized: true });
    } catch {
      localStorage.removeItem('focusdeck_token');
      set({ token: null, user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login({ email, password });
      get().setSession(data.token, data.user);
    } finally {
      set({ loading: false });
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.signup({ name, email, password });
      get().setSession(data.token, data.user);
    } finally {
      set({ loading: false });
    }
  },
}));
