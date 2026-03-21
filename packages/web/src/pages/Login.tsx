import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/filter', { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setSending(false);

    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-surface-950 tracking-heading">Filter</h1>
          <p className="mt-2 text-sm text-surface-600">Press inbox triage, powered by Claude</p>
        </div>

        <div className="rounded-xl border border-surface-300 bg-surface-50 p-6">
          {sent ? (
            <div className="text-center">
              <Mail className="mx-auto mb-3 h-8 w-8 text-pink-500" />
              <p className="text-sm font-medium text-surface-950">Check your email</p>
              <p className="mt-1 text-xs text-surface-600">We sent a magic link to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-800">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-surface-500">
          <a href="/demo" className="text-pink-500 transition-colors hover:text-pink-400">
            View demo with sample data
          </a>
        </p>
      </div>
    </div>
  );
}
