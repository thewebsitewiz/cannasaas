import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Injector,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type SaveThemeConfigInput,
  SaveThemeConfigGQL,
  ThemeConfigGQL,
  type ThemeConfigQuery,
  MyThemableDispensariesGQL,
  type MyThemableDispensariesQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

export type ThemeConfig = NonNullable<ThemeConfigQuery['themeConfig']>;
export type ThemableDispensary =
  MyThemableDispensariesQuery['myThemableDispensaries'][number];

/**
 * Loads + persists the per-dispensary theme config.
 *
 * Scope (sc-637 follow-on):
 *   - dispensary_admin / budtender → locked to their own dispensary
 *     from the JWT claim; the picker isn't shown.
 *   - org_admin / super_admin     → can switch between every dispensary
 *     they own via `myThemableDispensaries`; `setActiveDispensary()`
 *     changes which row is loaded + edited.
 *
 * Logo + masthead uploads round-trip through the REST endpoints under
 * `/images/dispensary/:id/...`. The endpoints upsert the URL into
 * `theme_configs`, so a successful upload + `reload()` refreshes the
 * displayed image automatically.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);
  private readonly _uploading = signal<'logo' | 'masthead' | null>(null);
  private readonly _activeDispensaryId = signal<string | null>(null);

  readonly saving = this._saving.asReadonly();
  readonly uploading = this._uploading.asReadonly();

  /**
   * The dispensary currently being themed. Defaults to the JWT
   * `dispensaryId` claim; org_admin/super_admin can switch via
   * `setActiveDispensary()`. `null` is treated as "use the auth claim"
   * so the dispensary_admin flow is the no-config path.
   */
  readonly activeDispensaryId = computed<string | null>(
    () => this._activeDispensaryId() ?? this.auth.user()?.dispensaryId ?? null,
  );

  setActiveDispensary(dispensaryId: string): void {
    this._activeDispensaryId.set(dispensaryId);
  }

  constructor() {
    // When the auth user changes, drop any cached dispensary selection
    // so a logout / role switch doesn't keep stale state.
    effect(() => {
      this.auth.user();
      this._activeDispensaryId.set(null);
    });
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async save(input: SaveThemeConfigInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(SaveThemeConfigGQL);
      await firstValueFrom(gql.mutate({ variables: { input } }));
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  async uploadLogo(file: File): Promise<void> {
    await this.upload('logo', file);
  }

  async uploadMasthead(file: File): Promise<void> {
    await this.upload('masthead', file);
  }

  private async upload(kind: 'logo' | 'masthead', file: File): Promise<void> {
    const dispensaryId = this.activeDispensaryId();
    if (!dispensaryId) return;
    this._uploading.set(kind);
    try {
      const form = new FormData();
      form.append('file', file);
      await firstValueFrom(
        this.http.post<{ success: boolean; url: string }>(
          `${environment.apiUrl}/images/dispensary/${dispensaryId}/${kind}`,
          form,
        ),
      );
      this.reload();
    } finally {
      this._uploading.set(null);
    }
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.activeDispensaryId(),
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(ThemeConfigGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): ThemeConfig | null => r.data?.themeConfig ?? null));
    },
  });

  /**
   * Catalog of dispensaries the current admin is allowed to theme.
   * For super_admin / org_admin this returns all sites in scope; for
   * dispensary_admin it's a single-row list (which we hide in the UI).
   */
  readonly dispensariesResource = rxResource({
    params: () => ({ reload: this._reload() }),
    stream: () => {
      const gql = this.injector.get(MyThemableDispensariesGQL);
      return gql
        .fetch()
        .pipe(map((r) => r.data?.myThemableDispensaries ?? []));
    },
  });

  readonly config = computed<ThemeConfig | null>(
    () => this.resource.value() ?? null,
  );
  readonly themableDispensaries = computed<readonly ThemableDispensary[]>(
    () => this.dispensariesResource.value() ?? [],
  );
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
