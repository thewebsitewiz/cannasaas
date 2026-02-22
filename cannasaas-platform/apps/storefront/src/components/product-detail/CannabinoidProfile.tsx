/**
 * @file CannabinoidProfile.tsx
 * @app apps/storefront
 *
 * Visual display of cannabis cannabinoid and terpene profile.
 *
 * Shows:
 *   - THC percentage with a colour-coded progress bar
 *   - CBD percentage with a colour-coded progress bar
 *   - Terpene list with percentage (if available from lab results)
 *   - Strain genetics / lineage (if available)
 *
 * Design: Compact data visualisation with accessible colour + text
 * (never colour alone — percentages are always shown as text too).
 *
 * Accessibility:
 *   - Progress bars use role="meter" with aria-valuemin/max/now (WCAG 4.1.2)
 *   - aria-label on each meter describes what it measures
 *   - Terpene list is a proper <dl> (description list) (WCAG 1.3.1)
 *   - Colour coding supplemented by numeric values (WCAG 1.4.1)
 */

interface Terpene {
  name: string;
  percentage?: number;
  /** Effect or aroma description */
  effect?: string;
}

interface CannabinoidProfileProps {
  thcContent?: number;
  cbdContent?: number;
  terpenes?: Terpene[];
  genetics?: string;
  /** Maximum THC to scale the progress bars against */
  maxThc?: number;
}

export function CannabinoidProfile({
  thcContent,
  cbdContent,
  terpenes,
  genetics,
  maxThc = 35,
}: CannabinoidProfileProps) {
  if (!thcContent && !cbdContent && !terpenes?.length && !genetics) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-stone-900">Lab Results</h2>

      {/* ── THC + CBD bars ─────────────────────────────────────────────────── */}
      {(thcContent != null || cbdContent != null) && (
        <div className="space-y-3" role="group" aria-label="Cannabinoid percentages">

          {thcContent != null && (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-stone-700">THC</span>
                <span className="text-sm font-bold text-green-700">{thcContent}%</span>
              </div>
              {/* Progress bar — meter semantic */}
              <div
                role="meter"
                aria-label={`THC content: ${thcContent}%`}
                aria-valuenow={thcContent}
                aria-valuemin={0}
                aria-valuemax={maxThc}
                aria-valuetext={`${thcContent} percent THC`}
                className="h-2.5 bg-stone-100 rounded-full overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (thcContent / maxThc) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {cbdContent != null && cbdContent > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-stone-700">CBD</span>
                <span className="text-sm font-bold text-blue-700">{cbdContent}%</span>
              </div>
              <div
                role="meter"
                aria-label={`CBD content: ${cbdContent}%`}
                aria-valuenow={cbdContent}
                aria-valuemin={0}
                aria-valuemax={maxThc}
                aria-valuetext={`${cbdContent} percent CBD`}
                className="h-2.5 bg-stone-100 rounded-full overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="h-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cbdContent / maxThc) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Terpene profile ───────────────────────────────────────────────── */}
      {terpenes && terpenes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-2.5">
            Terpene Profile
          </h3>
          <dl className="flex flex-wrap gap-2">
            {terpenes.map((terp) => (
              <div
                key={terp.name}
                className="flex flex-col items-center px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl"
                title={terp.effect ?? terp.name}
              >
                <dt className="text-xs font-semibold text-purple-800">{terp.name}</dt>
                {terp.percentage != null && (
                  <dd className="text-[10px] text-purple-600 mt-0.5">{terp.percentage}%</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* ── Genetics / Lineage ───────────────────────────────────────────── */}
      {genetics && (
        <div className="text-sm">
          <span className="font-semibold text-stone-700">Genetics: </span>
          <span className="text-stone-600">{genetics}</span>
        </div>
      )}
    </div>
  );
}
