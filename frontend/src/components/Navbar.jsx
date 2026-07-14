import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="surface border-b border-theme sticky top-0 z-40 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm">
              AI
            </span>
            <span>TaskPlatform</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            {user && (
              <>
                <Link to="/dashboard" className="hover:text-accent transition-colors">
                  Dashboard
                </Link>
                <Link to="/dashboard?new=1" className="hover:text-accent transition-colors">
                  New Task
                </Link>
              </>
            )}
            <Link to="/terms" className="hover:text-accent transition-colors">
              Terms
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-muted">
                  {user.name} <span className="text-xs uppercase text-accent">({user.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-theme hover:bg-accent-soft transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-accent-soft transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
