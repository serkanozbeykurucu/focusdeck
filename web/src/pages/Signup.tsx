import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';

export function Signup() {
  const navigate = useNavigate();
  const { signup, loading, user } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl text-ink">
          Create your Focus<span className="text-accent">Deck</span> account
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Pomodoro · flashcards · spaced repetition</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
