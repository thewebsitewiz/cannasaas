import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

@Component({
  selector: 'cs-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl p-8">
      <h1 class="text-3xl font-semibold">CannaSaaS storefront</h1>
      <p class="mt-2 text-sm text-stone-600">
        Angular 21 shell. Tenant slug:
        <code class="rounded bg-stone-100 px-1.5 py-0.5">{{ slug() ?? '(none)' }}</code>
      </p>
      <p class="mt-2 text-sm text-stone-500">
        Feature routes (products, cart, checkout, account, orders, login) land here as each is
        migrated from the React storefront.
      </p>
    </main>
  `,
})
export class HomePage {
  private readonly ctx = inject(DispensaryContextService);
  readonly slug = this.ctx.slug;
}
