import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/auth';
import AuthShell, { authInput } from '../components/AuthShell';

export default function Signup() {
  const [formData, setFormData] = useState({ firmName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const session = useSession();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { firm_name: formData.firmName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If "Confirm email" is off, Supabase returns a session immediately
    if (data.session) {
      navigate('/app/dashboard', { replace: true });
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  // Already signed in
  if (session) return <Navigate to="/app/dashboard" replace />;

  const field = (id, label, type, placeholder, autoComplete) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input id={id} name={id} type={type} autoComplete={autoComplete} required value={formData[id]} onChange={handleChange} className={`${authInput} mt-1.5`} placeholder={placeholder} />
    </div>
  );

  return (
    <AuthShell
      title="Register your firm"
      subtitle="Create an account to start managing your practice."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link></>}
    >
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          Account created. Check your email to confirm the address, then sign in.
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          {field('firmName', 'Firm name', 'text', 'CA Mangal & Co', 'organization')}
          {field('email', 'Email address', 'email', 'you@firm.com', 'email')}
          {field('password', 'Password', 'password', 'At least 6 characters', 'new-password')}
          {field('confirmPassword', 'Confirm password', 'password', 'Repeat your password', 'new-password')}
          <button type="submit" disabled={loading} className="press w-full h-12 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
