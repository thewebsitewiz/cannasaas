/**
 * ═══════════════════════════════════════════════════════════════════
 * EffectsAndFlavors — Tag Chip Display
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/EffectsAndFlavors.tsx
 *
 * Two groups of tag chips: effects (Relaxed, Happy, Euphoric) and
 * flavors (Citrus, Pine, Berry). These are subjective attributes
 * reported by consumers and budtenders.
 *
 * Visual:
 *   Effects:  [😊 Happy] [😌 Relaxed] [🧠 Creative] [💤 Sleepy]
 *   Flavors:  [🍋 Citrus] [🌲 Pine] [🫐 Berry] [🌍 Earthy]
 *
 * Accessibility (WCAG):
 *   - Each group has a heading (h3) for structure (1.3.1)
 *   - <ul>/<li> lists for screen reader enumeration (1.3.1)
 *   - Emoji icons are aria-hidden — text label is the name (1.1.1)
 *   - Tags are non-interactive (no misleading button appearance)
 *
 * Responsive:
 *   - Tags wrap naturally (flex-wrap)
 *   - Gap: 1.5 mobile → 2 sm+
 *   - Padding: px-2.5 py-1 mobile → px-3 py-1.5 sm+
 */

const EFFECT_ICONS: Record<string, string> = {
  happy: '😊', relaxed: '😌', euphoric: '✨', creative: '🧠',
  sleepy: '💤', energetic: '⚡', focused: '🎯', uplifted: '🌤️',
  hungry: '🍽️', talkative: '💬', giggly: '😄', tingly: '🫧',
};

const FLAVOR_ICONS: Record<string, string> = {
  citrus: '🍋', pine: '🌲', berry: '🫐', earthy: '🌍',
  sweet: '🍬', woody: '🪵', floral: '🌸', spicy: '🌶️',
  herbal: '🌿', tropical: '🥭', grape: '🍇', diesel: '⛽',
  cheese: '🧀', mint: '🍃', vanilla: '🍦', lavender: '💜',
  skunk: '🦨', peppery: '🫑',
};

function TagGroup({
  title,
  items,
  iconMap,
  colorClasses,
}: {
  title: string;
  items: string[];
  iconMap: Record<string, string>;
  colorClasses: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs sm:text-sm font-semibold">{title}</h3>
      <ul role="list" className="flex flex-wrap gap-1.5 sm:gap-2 list-none p-0 m-0">
        {items.map((item) => {
          const icon = iconMap[item.toLowerCase()];
          return (
            <li key={item}>
              <span className={`
                inline-flex items-center gap-1
                px-2.5 py-1 sm:px-3 sm:py-1.5
                rounded-full text-xs sm:text-sm font-medium
                ${colorClasses}
              `}>
                {icon && <span aria-hidden="true" className="text-xs">{icon}</span>}
                <span className="capitalize">{item}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface EffectsAndFlavorsProps {
  effects?: string[];
  flavors?: string[];
}

export function EffectsAndFlavors({ effects = [], flavors = [] }: EffectsAndFlavorsProps) {
  if (effects.length === 0 && flavors.length === 0) return null;

  return (
    <div className="space-y-4">
      <TagGroup
        title="Effects"
        items={effects}
        iconMap={EFFECT_ICONS}
        colorClasses="bg-violet-50 text-violet-700 border border-violet-200"
      />
      <TagGroup
        title="Flavors"
        items={flavors}
        iconMap={FLAVOR_ICONS}
        colorClasses="bg-amber-50 text-amber-700 border border-amber-200"
      />
    </div>
  );
}
