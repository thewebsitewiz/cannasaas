import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { Shield } from 'lucide-react';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await login(email, password); nav('/'); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-8">
        <div className="text-center mb-6">
          <Shield size={40} className="mx-auto text-brand-400 mb-2" />
          <h1 className="text-xl font-bold text-white">Platform Manager</h1>
          <p className="text-sm text-slate-400">Super admin access only</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700">Sign In</button>
        </form>
      </div>
    </div>
  );
}
