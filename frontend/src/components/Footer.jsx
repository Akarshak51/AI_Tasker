import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="surface border-t border-theme mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-extrabold text-lg mb-2">
            <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs">
              AI
            </span>
            TaskPlatform
          </div>
          <p className="text-muted">Asynchronous AI task processing, built on the MERN stack.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-muted">
            <li><Link to="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link></li>
            <li><Link to="/dashboard?new=1" className="hover:text-accent transition-colors">New Task</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-muted">
            <li><Link to="/login" className="hover:text-accent transition-colors">Login</Link></li>
            <li><Link to="/register" className="hover:text-accent transition-colors">Sign up</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-muted">
            <li><Link to="/terms" className="hover:text-accent transition-colors">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-theme py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} AI Task Platform. All rights reserved.
      </div>
    </footer>
  );
}
