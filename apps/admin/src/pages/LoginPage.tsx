import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) { setError('Please enter a valid email address'); return; }
    if (!isPasswordValid) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Login failed (${res.status})`);
      }

      const data = await res.json();
      const token = data.accessToken ?? data.access_token ?? data.token;

      if (!token) throw new Error('No token in response');

      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));

      setAuth(token, {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        dispensaryId: payload.dispensaryId,
        organizationId: payload.organizationId,
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-alt flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-txt">CannaSaas</h1>
          <p className="text-txt-secondary mt-2">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-txt mb-6">Sign In</h2>

          {error && (
            <div className="bg-danger-bg text-danger text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              required
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-brand-600 text-txt-inverse font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
