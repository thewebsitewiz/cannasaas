/**
 * ═══════════════════════════════════════════════════════════════════
 * CannabinoidProfile — Visual Potency Meters
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/CannabinoidProfile.tsx
 *
 * Displays THC, CBD, and optional minor cannabinoid percentages as
 * horizontal meter bars with numeric labels. Critical information
 * for cannabis consumers.
 *
 * Visual:
 *   THC  ████████████░░░░░░░░  24.5%
 *   CBD  ██░░░░░░░░░░░░░░░░░░   1.2%
 *   CBN  █░░░░░░░░░░░░░░░░░░░   0.3%
 *
 * Bar widths are proportional to sensible per-compound maximums:
 *   THC: 35%   CBD: 25%   Minor cannabinoids: 5%
 *
 * Accessibility (WCAG):
 *   - role="meter" with aria-valuenow/min/max/label (4.1.2)
 *     role="meter" is correct for a scalar measurement within
 *     a known range — NOT role="progressbar" (that implies a
 *     task progressing toward completion)
 *   - <abbr title="Tetrahydrocannabinol"> for acronyms (1.3.1)
 *   - Numeric values always visible alongside bars — color is
 *     never the sole indicator (1.4.1)
 *   - High contrast between bar fill and track (1.4.11)
 *
 * Responsive:
 *   - Label: w-10 sm:w-12 (fixed) so bars align vertically
 *   - Bar: h-2.5 mobile → h-3 sm+
 *   - Value: text-xs mobile → text-sm sm+
 */

interface CannabinoidBar {
  abbreviation: string;
  fullName: string;
  value: number;
  max: number;
  colorClass: string;
}

interface CannabinoidProfileProps {
  thcContent?: number | null;
  cbdContent?: number | null;
  /** Minor cannabinoids: CBN, CBG, THCV, etc. */
  cannabinoids?: Array<{ name: string; fullName: string; value: number }>;
}

export function CannabinoidProfile({
  thcContent,
  cbdContent,
  cannabinoids = [],
}: CannabinoidProfileProps) {
  const bars: CannabinoidBar[] = [];

  if (thcContent != null) {
    bars.push({
      abbreviation: 'THC',
      fullName: 'Tetrahydrocannabinol',
      value: thcContent,
      max: 35,
      colorClass: 'bg-emerald-600',
    });
  }
  if (cbdContent != null) {
    bars.push({
      abbreviation: 'CBD',
      fullName: 'Cannabidiol',
      value: cbdContent,
      max: 25,
      colorClass: 'bg-blue-500',
    });
  }
  for (const c of cannabinoids) {
    bars.push({
      abbreviation: c.name,
      fullName: c.fullName,
      value: c.value,
      max: 5,
      colorClass: 'bg-amber-500',
    });
  }

  if (bars.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm sm:text-base font-semibold">Cannabinoid Profile</h2>

      <div className="space-y-2.5">
        {bars.map((bar) => {
          const widthPercent = Math.min((bar.value / bar.max) * 100, 100);

          return (
            <div key={bar.abbreviation} className="flex items-center gap-3">
              {/* Label — fixed width for vertical alignment */}
              <span className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-right flex-shrink-0">
                <abbr title={bar.fullName} className="no-underline">
                  {bar.abbreviation}
                </abbr>
              </span>

              {/* Meter bar */}
              <div className="flex-1 min-w-0">
                <div
                  role="meter"
                  aria-label={`${bar.fullName}: ${bar.value.toFixed(1)}%`}
                  aria-valuenow={bar.value}
                  aria-valuemin={0}
                  aria-valuemax={bar.max}
                  className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bar.colorClass}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>

              {/* Numeric value — WCAG 1.4.1 (color not sole indicator) */}
              <span className="w-14 sm:w-16 text-xs sm:text-sm font-medium tabular-nums text-right flex-shrink-0">
                {bar.value.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
