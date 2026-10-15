import { Link, NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink-muted hover:text-ink hover:bg-white/70'
  }`;

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b border-surface-border/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/dashboard" className="font-display text-lg tracking-tight text-ink">
          Focus<span className="text-accent">Deck</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>
          <NavLink to="/documents" className={linkClass}>
            <BookOpen size={16} />
            <span className="hidden sm:inline">Documents</span>
          </NavLink>
          <NavLink to="/stats" className={linkClass}>
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Stats</span>
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-muted sm:inline">{user?.name}</span>
          <button type="button" className="btn-ghost px-2 py-1.5" onClick={logout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
