/**
 * @file EffectsFlavorTags.tsx
 * @app apps/storefront
 *
 * Pill tag lists for product effects and flavors.
 *
 * Renders two tag groups:
 *   Effects — "uplifting", "creative", "euphoric", "relaxing", etc.
 *   Flavors  — "berry", "sweet", "earthy", "citrus", etc.
 *
 * Each effect/flavor type has a distinct icon and colour for
 * quick visual scanning while still being distinguishable by text
 * (WCAG 1.4.1 — no colour-only information).
 *
 * Accessibility:
 *   - Each group is a <section> with <h3> (WCAG 1.3.1)
 *   - Tags are <ul><li> (WCAG 1.3.1)
 *   - Icons are aria-hidden (decorative)
 */

const EFFECT_ICONS: Record<string, string> = {
  uplifting:   '☀️',
  creative:    '✨',
  euphoric:    '😊',
  relaxing:    '🌙',
  energetic:   '⚡',
  focused:     '🎯',
  happy:       '😄',
  sleepy:      '💤',
  hungry:      '🍴',
  talkative:   '💬',
  giggly:      '😄',
  aroused:     '❤️',
  tingly:      '✨',
  default:     '🌿',
};

const FLAVOR_ICONS: Record<string, string> = {
  berry:    '🫐',
  sweet:    '🍬',
  earthy:   '🌱',
  citrus:   '🍋',
  pine:     '🌲',
  woody:    '🪵',
  spicy:    '🌶️',
  floral:   '🌸',
  herbal:   '🌿',
  tropical: '🥭',
  grape:    '🍇',
  mint:     '🍃',
  default:  '🌿',
};

interface EffectsFlavorTagsProps {
  effects?: string[];
  flavors?: string[];
}

function TagList({
  title,
  items,
  iconMap,
  colorClass,
}: {
  title: string;
  items: string[];
  iconMap: Record<string, string>;
  colorClass: string;
}) {
  if (!items.length) return null;

  return (
    <section aria-labelledby={`${title.toLowerCase()}-heading`} className="space-y-2.5">
      <h3 id={`${title.toLowerCase()}-heading`} className="text-sm font-semibold text-stone-700">
        {title}
      </h3>
      <ul role="list" className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <span
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1',
                'rounded-full text-xs font-medium',
                'border',
                colorClass,
              ].join(' ')}
            >
              <span aria-hidden="true">
                {iconMap[item.toLowerCase()] ?? iconMap.default}
              </span>
              {/* Capitalize first letter */}
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EffectsFlavorTags({ effects = [], flavors = [] }: EffectsFlavorTagsProps) {
  if (!effects.length && !flavors.length) return null;

  return (
    <div className="space-y-4">
      <TagList
        title="Effects"
        items={effects}
        iconMap={EFFECT_ICONS}
        colorClass="bg-green-50 border-green-200 text-green-700"
      />
      <TagList
        title="Flavors"
        items={flavors}
        iconMap={FLAVOR_ICONS}
        colorClass="bg-amber-50 border-amber-200 text-amber-700"
      />
    </div>
  );
}
