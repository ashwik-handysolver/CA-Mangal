import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/auth';
import AuthShell, { authInput } from '../components/AuthShell';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const session = useSession();
  // Page the user was sent here from (see Layout), else the dashboard
  const target = useLocation().state?.from || '/app/dashboard';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setError(signInError.message);
    } else if (data.session) {
      navigate(target, { replace: true });
    }
    setLoading(false);
  };

  // Already signed in
  if (session) return <Navigate to={target} replace />;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your firm's workspace."
      footer={<>New here? <Link to="/signup" className="font-semibold text-brand-600 hover:underline">Register a firm</Link></>}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={`${authInput} mt-1.5`} placeholder="you@firm.com" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required value={formData.password} onChange={handleChange} className={`${authInput} mt-1.5`} placeholder="Your password" />
        </div>

        <button type="submit" disabled={loading} className="press w-full h-12 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
