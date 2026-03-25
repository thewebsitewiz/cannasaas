'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

const AGE_GATE_KEY = 'cannasaas-age-confirmed';

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already confirmed this session
    const stored = sessionStorage.getItem(AGE_GATE_KEY);
    setConfirmed(stored === 'true');
  }, []);

  const handleConfirm = () => {
    if (!dob) {
      setError('Please enter your date of birth');
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 21) {
      setError('You must be 21 or older to enter this site.');
      return;
    }

    sessionStorage.setItem(AGE_GATE_KEY, 'true');
    setConfirmed(true);
  };

  const handleDeny = () => {
    window.location.href = 'https://google.com';
  };

  // Still loading from sessionStorage
  if (confirmed === null) {
    return null;
  }

  // Already confirmed
  if (confirmed) {
    return <>{children}</>;
  }

  // Show the gate
  return (
    <div className="fixed inset-0 z-[9999] bg-gs-forest flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gs-pine flex items-center justify-center">
            <ShieldCheck size={40} className="text-gs-sage" />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-gs-cream mb-2">
          Are you 21 or older?
        </h1>
        <p className="text-gs-mist text-sm mb-8">
          You must be of legal age to view this website.
          By entering, you agree to our terms of service.
        </p>

        {/* DOB input */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gs-mist mb-2 uppercase tracking-wider">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => { setDob(e.target.value); setError(''); }}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-gs-deep-pine border border-gs-pine rounded-xl text-gs-cream text-center text-lg focus:outline-none focus:ring-2 focus:ring-gs-sage focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-gs-fern text-gs-cream font-semibold rounded-xl hover:bg-gs-sage transition-colors text-lg"
          >
            Enter Site
          </button>
          <button
            onClick={handleDeny}
            className="w-full py-3 text-gs-mist text-sm hover:text-gs-cream transition-colors"
          >
            No, I am under 21
          </button>
        </div>

        {/* Legal */}
        <p className="text-gs-stone text-xs mt-8 leading-relaxed">
          This website contains information about cannabis products.
          Cannabis is only available for purchase in licensed dispensaries
          by adults aged 21 and older. Must present valid government-issued ID.
        </p>
      </div>
    </div>
  );
}
