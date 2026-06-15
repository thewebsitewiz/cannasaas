import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import type { ThemableDispensary } from '../theme.service';

/**
 * Visible only when the current admin can theme more than one site
 * (org_admin / super_admin). dispensary_admin is single-site and
 * gets a no-op (parent simply doesn't render this).
 */
@Component({
  selector: 'cs-theme-dispensary-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
      aria-label="Dispensary picker"
    >
      <label class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
        Site
      </label>
      <select
        (change)="onChange($event)"
        aria-label="Choose dispensary to theme"
        class="rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
      >
        @for (d of dispensaries(); track d.entityId) {
          <option [value]="d.entityId" [selected]="d.entityId === activeId()">
            {{ d.name }} ({{ d.slug }})
          </option>
        }
      </select>
      <span class="text-xs text-(--color-text-muted)">
        You have access to {{ dispensaries().length }} sites.
      </span>
    </div>
  `,
})
export class ThemeDispensaryPickerComponent {
  readonly dispensaries = input.required<readonly ThemableDispensary[]>();
  readonly activeId = input<string | null>(null);

  readonly select = output<string>();

  protected onChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id) this.select.emit(id);
  }
}
