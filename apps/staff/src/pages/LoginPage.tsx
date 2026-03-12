import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('admin@greenleaf.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Login failed'); }
      const data = await res.json();
      const token = data.accessToken ?? data.access_token ?? data.token;
      if (!token) throw new Error('No token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAuth(token, { sub: payload.sub, email: payload.email, role: payload.role, dispensaryId: payload.dispensaryId, organizationId: payload.organizationId });
      navigate('/');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Staff Portal</h1>
        <p className="text-gray-400 text-sm mb-6">CannaSaas</p>
        {error && <div className="bg-red-900/50 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>}
        <label className="block mb-4">
          <span className="text-sm text-gray-400">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500" required />
        </label>
        <label className="block mb-6">
          <span className="text-sm text-gray-400">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500" required />
        </label>
        <button type="submit" disabled={loading}
          className="w-full bg-brand-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
