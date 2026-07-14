import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-20 text-center animate-fadeInUp">
      <span className="inline-block bg-accent-soft text-accent text-xs font-semibold px-3 py-1 rounded-full mb-4">
        MERN + Redis + Python Worker
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Run AI text tasks, <span className="text-accent">asynchronously</span> and reliably.
      </h1>
      <p className="text-muted max-w-2xl mx-auto mb-8">
        Create a task, watch it move through the queue, and see status, logs, and results update
        live — powered by a horizontally scalable background worker.
      </p>
      <div className="flex items-center justify-center gap-3">
        {user ? (
          <Link
            to="/dashboard"
            className="bg-accent text-white font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="bg-accent text-white font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="border border-theme font-semibold rounded-xl px-6 py-3 hover:bg-accent-soft transition-colors"
            >
              Log in
            </Link>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-16 text-left">
        {[
          ['Uppercase', 'Convert all characters to uppercase.'],
          ['Lowercase', 'Convert all characters to lowercase.'],
          ['Reverse String', 'Reverse the input string.'],
          ['Word Count', 'Count the total number of words.'],
        ].map(([title, desc]) => (
          <div key={title} className="surface border border-theme rounded-2xl p-5 animate-popIn">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
