import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptedTerms: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.acceptedTerms) {
      setError('You must accept the Terms & Conditions to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeInUp">
      <div className="surface border border-theme rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold mb-1">Create your account</h1>
        <p className="text-sm text-muted mb-6">Start creating and running AI tasks in minutes.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Full name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Jane Doe"
            />
          </div>

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
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full border border-theme rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="At least 6 characters"
            />
          </div>

          {/* Terms & Conditions card */}
          <div className="bg-accent-soft border border-theme rounded-xl p-4">
            <div className="max-h-28 overflow-y-auto text-xs text-muted mb-3 pr-1 leading-relaxed">
              By checking the box below you agree to our{' '}
              <Link to="/terms" target="_blank" className="text-accent underline">
                Terms &amp; Conditions
              </Link>
              , including lawful use of the platform, responsibility for your account
              credentials, and asynchronous processing of submitted tasks with no uptime
              guarantee.
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) => update('acceptedTerms', e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              I have read and accept the Terms &amp; Conditions
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-white font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
