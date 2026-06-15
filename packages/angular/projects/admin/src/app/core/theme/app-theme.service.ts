import { Injectable, effect, inject } from '@angular/core';
import { ThemeService } from '@cannasaas/ui-ng';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Reacts to the auth state and link-injects the per-dispensary CSS
 * served by `GET /css/dispensary/:id.css` (sc-637). Super-admins
 * without a dispensary claim get no per-tenant CSS — they keep the
 * bundled `dark` theme.
 *
 * Per [docs/architecture.md §8 row 10] the admin app previously had
 * a hard rule against per-tenant theme injection. That rule is
 * lifted now that the backend endpoint exists; the dispensary admin
 * sees their own brand mark when they log into the back-office,
 * matching what their staff and customers see.
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      const dispensaryId = this.auth.user()?.dispensaryId ?? null;
      this.theme.setDispensaryCss(environment.apiUrl, dispensaryId);
    });
  }
}
