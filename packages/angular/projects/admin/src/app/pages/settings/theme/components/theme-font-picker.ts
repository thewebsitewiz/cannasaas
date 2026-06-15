import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { BODY_FONTS, DISPLAY_FONTS, type CatalogFont } from '../font-catalog';

/**
 * Display + body font dropdowns (sc-637). Two stateless `<select>`s
 * backed by the curated catalog in `@cannasaas/types`; parent owns
 * the `displayFont` / `bodyFont` signals and reacts to the change
 * events. `null` represents "use the preset default".
 */
@Component({
  selector: 'cs-theme-font-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="space-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      aria-label="Fonts"
    >
      <h2 class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
        Fonts
      </h2>
      <p class="text-xs text-(--color-text-muted)">
        Drawn from a curated Google Fonts list. The CSS endpoint adds the
        <code>&#64;import</code> automatically — no extra setup.
      </p>
      <label class="block text-xs">
        <span class="mb-1 block font-semibold text-(--color-text-secondary)">
          Display font (headings)
        </span>
        <select
          (change)="onDisplay($event)"
          aria-label="Display font"
          class="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
        >
          <option value="" [selected]="!displayFont()">— Use preset default —</option>
          @for (f of displayFonts; track f.family) {
            <option [value]="f.family" [selected]="f.family === displayFont()">
              {{ f.family }}
            </option>
          }
        </select>
      </label>
      <label class="block text-xs">
        <span class="mb-1 block font-semibold text-(--color-text-secondary)">
          Body font
        </span>
        <select
          (change)="onBody($event)"
          aria-label="Body font"
          class="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
        >
          <option value="" [selected]="!bodyFont()">— Use preset default —</option>
          @for (f of bodyFonts; track f.family) {
            <option [value]="f.family" [selected]="f.family === bodyFont()">
              {{ f.family }}
            </option>
          }
        </select>
      </label>
    </section>
  `,
})
export class ThemeFontPickerComponent {
  readonly displayFont = input<string | null>(null);
  readonly bodyFont = input<string | null>(null);

  readonly displayFontChange = output<string | null>();
  readonly bodyFontChange = output<string | null>();

  protected readonly displayFonts: readonly CatalogFont[] = DISPLAY_FONTS;
  protected readonly bodyFonts: readonly CatalogFont[] = BODY_FONTS;

  protected onDisplay(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.displayFontChange.emit(v || null);
  }

  protected onBody(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.bodyFontChange.emit(v || null);
  }
}
