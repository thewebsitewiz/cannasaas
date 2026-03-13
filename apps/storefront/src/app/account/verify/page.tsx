'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useAuthStore } from '@/stores/auth.store';
import { ShieldCheck, AlertTriangle, Check } from 'lucide-react';

const VERIFY_MUTATION = `mutation($dob: String!, $idType: String!, $idState: String, $dispensaryId: ID, $method: String) {
  verifyAge(dateOfBirth: $dob, idType: $idType, idState: $idState, dispensaryId: $dispensaryId, method: $method) {
    verified age reason
  }
}`;

export default function VerifyPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [dob, setDob] = useState('');
  const [idType, setIdType] = useState('drivers_license');
  const [idState, setIdState] = useState('NY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; age: number; reason?: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [isAuthenticated, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await gqlAuth<any>(VERIFY_MUTATION, {
        dob, idType, idState,
        dispensaryId: DEFAULT_DISPENSARY_ID,
        method: 'self_declared',
      });
      setResult(data.verifyAge);
      if (data.verifyAge.verified && user) {
        setUser({ ...user, ageVerified: true });
        setTimeout(() => router.push('/account'), 2000);
      }
    } catch (err: any) {
      setResult({ verified: false, age: 0, reason: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <ShieldCheck size={40} className="mx-auto text-brand-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Age Verification</h1>
          <p className="text-sm text-gray-500 mt-1">You must be 21 or older to place an order</p>
        </div>

        {result?.verified ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <Check size={48} className="mx-auto text-green-600 mb-3" />
            <p className="text-lg font-semibold text-green-800">Verified! Age {result.age}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to your account...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {result && !result.verified && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} /> {result.reason || 'Verification failed'}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
                <option value="military_id">Military ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID State</label>
              <select value={idState} onChange={(e) => setIdState(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="NY">New York</option>
                <option value="NJ">New Jersey</option>
                <option value="CT">Connecticut</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify My Age'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
