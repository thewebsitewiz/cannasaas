import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Logo + masthead drop-zone pair (sc-637). Pure presenter — emits the
 * raw `File` and lets the parent route it through `ThemeService.uploadLogo`
 * / `.uploadMasthead`. Disabled-while-uploading state is driven by the
 * `uploading` signal input.
 */
@Component({
  selector: 'cs-theme-branding-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      aria-label="Branding assets"
    >
      <h2 class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
        Branding
      </h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p class="mb-2 text-xs font-semibold text-(--color-text-secondary)">
            Logo <span class="text-(--color-text-muted)">(2 MB max)</span>
          </p>
          <div
            class="flex h-24 items-center justify-center rounded-md border border-dashed border-(--color-border) bg-(--color-bg)"
          >
            @if (logoUrl(); as src) {
              <img
                [src]="src"
                alt="Current dispensary logo"
                class="max-h-20 max-w-full object-contain"
              />
            } @else {
              <span class="text-xs text-(--color-text-muted)">No logo uploaded</span>
            }
          </div>
          <label class="mt-2 block text-xs">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="onLogoSelected($event)"
              [disabled]="uploading() === 'logo'"
              aria-label="Upload dispensary logo"
              class="block w-full text-xs text-(--color-text-secondary)"
            />
          </label>
          @if (uploading() === 'logo') {
            <p class="mt-1 text-xs text-(--color-text-muted)" role="status">Uploading…</p>
          }
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold text-(--color-text-secondary)">
            Masthead <span class="text-(--color-text-muted)">(5 MB max)</span>
          </p>
          <div
            class="flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-(--color-border) bg-(--color-bg)"
          >
            @if (mastheadUrl(); as src) {
              <img
                [src]="src"
                alt="Current storefront masthead"
                class="h-full w-full object-cover"
              />
            } @else {
              <span class="text-xs text-(--color-text-muted)">No masthead uploaded</span>
            }
          </div>
          <label class="mt-2 block text-xs">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="onMastheadSelected($event)"
              [disabled]="uploading() === 'masthead'"
              aria-label="Upload storefront masthead"
              class="block w-full text-xs text-(--color-text-secondary)"
            />
          </label>
          @if (uploading() === 'masthead') {
            <p class="mt-1 text-xs text-(--color-text-muted)" role="status">Uploading…</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class ThemeBrandingUploadComponent {
  readonly logoUrl = input<string | null | undefined>(null);
  readonly mastheadUrl = input<string | null | undefined>(null);
  readonly uploading = input<'logo' | 'masthead' | null>(null);

  readonly logoFile = output<File>();
  readonly mastheadFile = output<File>();

  protected onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.logoFile.emit(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected onMastheadSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.mastheadFile.emit(file);
    (event.target as HTMLInputElement).value = '';
  }
}
