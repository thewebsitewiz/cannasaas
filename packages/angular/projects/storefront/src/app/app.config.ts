import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpHeaders, provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth/auth.service';
import { createAuthRetryLink } from './core/auth/auth-retry-link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      const auth = inject(AuthService);

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
          createAuthRetryLink(auth),
          httpLink.create({ uri: environment.graphqlUrl }),
        ]),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
          query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
        },
      };
    }),
  ],
};
