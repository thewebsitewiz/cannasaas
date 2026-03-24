'use client';

import { useState, useEffect } from 'react';
import { type Locale, getLocale, setLocale } from '@cannasaas/i18n';

export function LanguageSwitcher() {
  const [locale, setCurrentLocale] = useState<Locale>('en');

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  const toggle = () => {
    const next: Locale = locale === 'en' ? 'es' : 'en';
    setLocale(next);
    setCurrentLocale(next);
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded transition-colors"
      aria-label={`Switch language to ${locale === 'en' ? 'Spanish' : 'English'}`}
    >
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  );
}
