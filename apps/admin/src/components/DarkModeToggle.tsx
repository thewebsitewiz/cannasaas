import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' ||
           document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.setAttribute('data-theme', 'casual');
      localStorage.setItem('darkMode', 'false');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg hover:bg-gs-pine/50 transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-txt-muted" />}
    </button>
  );
}
