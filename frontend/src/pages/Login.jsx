import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fadeInUp">
      <div className="surface border border-theme rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold mb-1">Welcome back</h1>
        <p className="text-sm text-muted mb-6">Log in to view and manage your AI tasks.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-white font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
