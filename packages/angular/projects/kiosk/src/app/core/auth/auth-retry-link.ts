import { ApolloLink } from '@apollo/client';
import { Observable, type Subscription } from 'rxjs';
import { AuthService } from './auth.service';

/** Operations that must not be retried — retrying login would loop forever. */
const SKIP_OPERATIONS = new Set<string>(['Login']);

/**
 * Apollo link that catches `UNAUTHENTICATED` errors, drops the cached token,
 * forces a fresh login, and replays the original operation exactly once. After
 * one retry the original error surfaces — we don't want infinite loops if the
 * service-account creds themselves are bad.
 */
export function createAuthRetryLink(auth: AuthService): ApolloLink {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      let retried = false;
      let inner: Subscription | null = null;

      const run = (): void => {
        inner?.unsubscribe();
        inner = forward(operation).subscribe({
          next: (result) => {
            const unauthenticated = result.errors?.some(
              (e) => (e.extensions as { code?: string } | undefined)?.code === 'UNAUTHENTICATED',
            );
            if (
              unauthenticated &&
              !retried &&
              !SKIP_OPERATIONS.has(operation.operationName ?? '')
            ) {
              retried = true;
              auth.clearToken();
              auth
                .ensureLoggedIn()
                .then(() => run())
                .catch((err: unknown) => observer.error(err));
              return;
            }
            observer.next(result);
          },
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      };

      run();
      return () => inner?.unsubscribe();
    });
  });
}
