'use client';

interface FilterSidebarProps {
  facets: {
    strainTypes: Array<{ label: string; value: string; count: number }>;
    effects: Array<{ label: string; value: string; count: number }>;
    minThc: number;
    maxThc: number;
  } | null;
  filters: {
    strainType?: string;
    effects?: string[];
  };
  onFilterChange: (key: string, value: any) => void;
}

export function FilterSidebar({ facets, filters, onFilterChange }: FilterSidebarProps) {
  if (!facets) return null;

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-6">
      {/* Strain Type */}
      {facets.strainTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Type</h3>
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('strainType', undefined)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !filters.strainType ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All types
            </button>
            {facets.strainTypes.map((st) => (
              <button
                key={st.value}
                onClick={() => onFilterChange('strainType', st.value === filters.strainType ? undefined : st.value)}
                className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  filters.strainType === st.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {st.label} <span className="text-gray-400">({st.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Effects */}
      {facets.effects.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Effects</h3>
          <div className="space-y-1">
            {facets.effects.slice(0, 8).map((effect) => {
              const isActive = filters.effects?.includes(effect.value);
              return (
                <button
                  key={effect.value}
                  onClick={() => {
                    const current = filters.effects ?? [];
                    const next = isActive ? current.filter((e) => e !== effect.value) : [...current, effect.value];
                    onFilterChange('effects', next.length > 0 ? next : undefined);
                  }}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {effect.label} <span className="text-gray-400">({effect.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
