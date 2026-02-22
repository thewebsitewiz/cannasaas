/**
 * ═══════════════════════════════════════════════════════════════════
 * TerpeneProfile — Terpene Composition Bars
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/TerpeneProfile.tsx
 *
 * Ranked list of terpenes with proportional bars. Terpenes are
 * aromatic compounds in cannabis that influence flavor, aroma, and
 * the "entourage effect" on the product's character.
 *
 * Visual:
 *   Myrcene       ████████████░░░░  1.20%  Earthy, herbal
 *   Limonene      █████████░░░░░░░  0.80%  Citrus, lemon
 *   Caryophyllene ██████░░░░░░░░░░  0.50%  Peppery, spicy
 *
 * Bar widths are relative to the dominant (first) terpene —
 * the highest value gets 100% width, others scale proportionally.
 * This avoids tiny bars when all values are small.
 *
 * Accessibility (WCAG):
 *   - role="meter" per bar with full ARIA values (4.1.2)
 *   - <dl> (description list) groups name/value pairs (1.3.1)
 *   - Numeric % always visible alongside bars (1.4.1)
 *   - Aroma descriptions visible on sm+ (additional context)
 *
 * Responsive:
 *   - Names truncate on mobile (truncate class)
 *   - Descriptions hidden below sm (save space)
 *   - Bar height h-2, consistent across breakpoints
 */

/** Color palette — cycles if > 6 terpenes */
const COLORS = [
  'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
  'bg-rose-500', 'bg-sky-500', 'bg-orange-500',
];

interface Terpene {
  name: string;
  percentage: number;
  description?: string;
}

interface TerpeneProfileProps {
  terpenes: Terpene[];
}

export function TerpeneProfile({ terpenes }: TerpeneProfileProps) {
  if (terpenes.length === 0) return null;

  const maxValue = Math.max(...terpenes.map((t) => t.percentage), 0.01);

  return (
    <div className="space-y-3">
      <h2 className="text-sm sm:text-base font-semibold">Terpene Profile</h2>

      <dl className="space-y-2.5">
        {terpenes.map((terpene, idx) => {
          const widthPercent = (terpene.percentage / maxValue) * 100;
          return (
            <div key={terpene.name} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs sm:text-sm font-medium truncate">{terpene.name}</dt>
                <dd className="text-xs sm:text-sm font-medium tabular-nums text-muted-foreground flex-shrink-0">
                  {terpene.percentage.toFixed(2)}%
                </dd>
              </div>
              <div
                role="meter"
                aria-label={`${terpene.name}: ${terpene.percentage.toFixed(2)}%`}
                aria-valuenow={terpene.percentage}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                className="h-2 bg-muted rounded-full overflow-hidden"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${COLORS[idx % COLORS.length]}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              {terpene.description && (
                <dd className="hidden sm:block text-xs text-muted-foreground pl-0.5">
                  {terpene.description}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
