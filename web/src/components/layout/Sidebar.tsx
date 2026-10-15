import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, BarChart3, Upload } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: BookOpen },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="hidden w-52 shrink-0 border-r border-surface-border bg-white/60 p-4 lg:block">
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink-muted hover:bg-surface-muted'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
