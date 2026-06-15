import { Injectable, effect, inject } from '@angular/core';
import { ThemeService } from '@cannasaas/ui-ng';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Link-injects `GET /css/dispensary/:id.css` whenever the JWT
 * `dispensaryId` claim changes (sc-637 follow-on). Staff are always
 * scoped to a single dispensary; super-admins covering the floor
 * (no dispensary claim) fall through to the bundled `modern` theme.
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
