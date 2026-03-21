/**
 * @file ThemePicker.tsx
 * @package @cannasaas/ui
 *
 * Compact preset selector for quick theme switching.
 * For the full designer, see apps/admin/src/pages/Settings/ThemePage.tsx
 */

import { THEME_PRESETS, DEFAULT_PRESET, type PresetId } from './themes/presets';

interface ThemePickerProps {
  activePreset: string;
  onSelect: (presetId: PresetId) => void;
}

export function ThemePicker({ activePreset, onSelect }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {Object.values(THEME_PRESETS).map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id as PresetId)}
            className={`rounded-xl border-2 overflow-hidden transition-all ${
              isActive
                ? 'border-brand-600 ring-2 ring-brand-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className="aspect-[4/3] p-2"
              style={{ background: preset.bgPrimary }}
            >
              <div
                className="h-1.5 rounded-full mb-1"
                style={{ background: preset.primary, width: '40%' }}
              />
              <div
                className="h-1 rounded-full"
                style={{ background: preset.primary, opacity: 0.15, width: '80%' }}
              />
            </div>
            <div className="px-2 py-1.5 text-center bg-white border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-900">{preset.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
