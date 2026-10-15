import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Upload } from './pages/Upload';
import { StudySession } from './pages/StudySession';
import { Stats } from './pages/Stats';
import { useAuthStore } from './stores/authStore';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/study/:documentId" element={<StudySession />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
