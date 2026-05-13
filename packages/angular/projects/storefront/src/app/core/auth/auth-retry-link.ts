import { ApolloLink } from '@apollo/client';
import { Observable, type Subscription } from 'rxjs';
import { AuthService } from './auth.service';

/** Operations that must not be retried — retrying would loop forever. */
const SKIP_OPERATIONS = new Set<string>(['Login', 'Register']);

/**
 * Apollo link that catches `UNAUTHENTICATED` errors, attempts a single
 * refresh, and replays the original operation if the refresh produced a new
 * access token. If refresh fails (network, expired cookie, etc.) the local
 * token is cleared and the original error result is emitted to the caller so
 * the UI can route to /login. One retry max; further `UNAUTHENTICATED`s on
 * the replay surface untouched.
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
              auth
                .refresh()
                .then((token) => {
                  if (token) {
                    run();
                  } else {
                    auth.clearToken();
                    observer.next(result);
                    observer.complete();
                  }
                })
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
