import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';

export function Login() {
  const navigate = useNavigate();
  const { login, loading, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl text-ink">
          Focus<span className="text-accent">Deck</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to continue studying</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          No account?{' '}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
