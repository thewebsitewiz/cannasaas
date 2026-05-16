import { HttpHeaders } from '@angular/common/http';
import { ApolloLink } from '@apollo/client';
import { AuthService } from './auth.service';

/**
 * Adds `Authorization: Bearer <token>` to every outgoing GraphQL operation
 * when the staff user is signed in. Pulls the token through the supplied
 * `AuthService` instance (a signal read), so token rotation after refresh
 * lands on the next request without recreating the link.
 */
export function createAuthMiddleware(auth: AuthService): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const token = auth.accessToken();
    if (token) {
      operation.setContext({
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      });
    }
    return forward(operation);
  });
}
