import { useEffect, useState } from 'react';
import { Sparkles, Wrench, Bug, Zap } from 'lucide-react';

interface ChangelogEntry {
  entry_id: string;
  version: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  feature: { label: 'Feature', color: 'bg-green-100 text-green-800', icon: Sparkles },
  improvement: { label: 'Improvement', color: 'bg-blue-100 text-blue-800', icon: Zap },
  fix: { label: 'Fix', color: 'bg-orange-100 text-orange-800', icon: Bug },
  internal: { label: 'Internal', color: 'bg-gray-100 text-gray-800', icon: Wrench },
};

export function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mark as seen
    localStorage.setItem('changelog_last_seen', new Date().toISOString());

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/changelog`)
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-txt-secondary">Loading changelog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-txt-primary mb-2">What's New</h1>
      <p className="text-txt-secondary mb-8">Latest updates and improvements to CannaSaas.</p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gs-200 dark:bg-gs-700" />

        <div className="space-y-8">
          {entries.map((entry) => {
            const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.feature;
            const Icon = config.icon;
            const date = new Date(entry.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            });

            return (
              <div key={entry.entry_id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-gs-800 border-2 border-gs-200 dark:border-gs-700 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-brand-600" />
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded">
                      v{entry.version}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-txt-muted">{date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-txt-primary mb-1">{entry.title}</h3>
                  {entry.description && (
                    <p className="text-sm text-txt-secondary leading-relaxed">{entry.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-center text-txt-muted py-12">No changelog entries yet.</p>
      )}
    </div>
  );
}
