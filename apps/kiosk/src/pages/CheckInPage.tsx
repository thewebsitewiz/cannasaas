import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { UserCheck, Phone, ScanLine, ArrowRight, Star, Loader2 } from 'lucide-react';

const CUSTOMER_BY_PHONE_QUERY = `query($phone: String!) {
  customerByPhone(phone: $phone) {
    id firstName lastName loyaltyTier pointsBalance
  }
}`;

export function CheckInPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customerByPhone', phone],
    queryFn: () => gql<any>(CUSTOMER_BY_PHONE_QUERY, { phone }),
    select: (d) => d.customerByPhone,
    enabled: submitted && phone.length >= 10,
    retry: false,
  });

  const handleSubmit = () => {
    if (phone.length >= 10) setSubmitted(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitted(false);
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const tierColors: Record<string, string> = {
    gold: 'bg-amber-100 text-amber-700',
    silver: 'bg-gray-100 text-gray-700',
    platinum: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
            <UserCheck size={40} className="text-brand-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome</h1>
          <p className="text-lg text-gray-500 mt-2">Check in to get started</p>
        </div>

        {/* Customer found */}
        {submitted && customer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Hey, {customer.firstName}! 👋
              </h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                {customer.loyaltyTier && (
                  <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${tierColors[customer.loyaltyTier] ?? 'bg-green-100 text-green-700'}`}>
                    {customer.loyaltyTier} Member
                  </span>
                )}
              </div>
            </div>

            {customer.pointsBalance != null && (
              <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-center gap-3">
                <Star size={24} className="text-brand-600" />
                <span className="text-2xl font-bold text-brand-700">{customer.pointsBalance}</span>
                <span className="text-brand-600 font-medium">points</span>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-3 bg-brand-600 text-white py-5 rounded-2xl text-xl font-bold hover:bg-brand-700 active:bg-brand-800 transition-colors min-h-[64px]"
            >
              Start Shopping <ArrowRight size={24} />
            </button>
          </div>
        )}

        {/* Loading */}
        {submitted && isLoading && (
          <div className="flex items-center justify-center gap-3 py-8 text-gray-500">
            <Loader2 size={24} className="animate-spin" /> Looking you up...
          </div>
        )}

        {/* Not found / new customer */}
        {submitted && !isLoading && !customer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
            <p className="text-lg text-gray-600">We didn't find an account for that number.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-5 rounded-2xl text-xl font-bold hover:bg-gray-900 active:bg-black transition-colors min-h-[64px]"
            >
              New here? Continue as guest <ArrowRight size={24} />
            </button>
            <button
              onClick={() => { setSubmitted(false); setPhone(''); }}
              className="text-brand-600 font-semibold text-lg hover:underline"
            >
              Try a different number
            </button>
          </div>
        )}

        {/* Phone input */}
        {!submitted && (
          <div className="space-y-6">
            <div className="relative">
              <Phone size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={formatPhone(phone)}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-200 text-2xl text-center font-semibold text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none min-h-[72px]"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={phone.length < 10}
              className="w-full flex items-center justify-center gap-3 bg-brand-600 text-white py-5 rounded-2xl text-xl font-bold hover:bg-brand-700 active:bg-brand-800 disabled:opacity-40 transition-colors min-h-[64px]"
            >
              <UserCheck size={24} /> Check In
            </button>

            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-sm font-medium">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-5 rounded-2xl text-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[64px]"
            >
              <ScanLine size={24} /> Skip — Browse as Guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
