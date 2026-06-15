import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { HttpHeaders, provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { createAuthRetryLink } from './core/auth/auth-retry-link';
import { AuthService } from './core/auth/auth.service';
import { DeviceSignerService } from './core/attestation/device-signer.service';
import { createDeviceSignatureLink } from './core/attestation/device-signature-link';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { AppThemeService } from './core/theme/app-theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      const auth = inject(AuthService);
      const signer = inject(DeviceSignerService);

      const authMiddleware = new ApolloLink((operation, forward) => {
        const token = auth.accessToken();
        if (token) {
          operation.setContext({
            headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
          });
        }
        return forward(operation);
      });

      return {
        cache: new InMemoryCache(),
        link: ApolloLink.from([
          authMiddleware,
          createDeviceSignatureLink(signer),
          createAuthRetryLink(auth),
          httpLink.create({ uri: environment.graphqlUrl }),
        ]),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
          query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
        },
      };
    }),
    { provide: ErrorHandler, useExisting: GlobalErrorHandler },
    // Per-dispensary CSS link is one-shot — environment.dispensaryId is
    // baked in at provisioning time (sc-637 follow-on).
    provideAppInitializer(() => {
      inject(AppThemeService).apply();
    }),
  ],
};
