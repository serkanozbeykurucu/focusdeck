import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppShell() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  );
}
