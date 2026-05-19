import { io, type Socket } from 'socket.io-client';

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  import.meta.env.VITE_GRAPHQL_URL?.replace(/\/graphql$/, '') ??
  'http://localhost:3000';

let cached: { socket: Socket; token: string } | null = null;

/**
 * Shared socket for the admin app. Token-keyed singleton so a logout +
 * re-login doesn't reuse a stale auth context. Callers should attach
 * their `.on()` listeners and detach with `.off()` on cleanup; the
 * socket itself stays open for the lifetime of the session.
 */
export function getAdminSocket(token: string): Socket {
  if (cached && cached.token === token) return cached.socket;
  if (cached) {
    cached.socket.disconnect();
    cached = null;
  }
  const socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
  });
  cached = { socket, token };
  return socket;
}

export function closeAdminSocket(): void {
  if (cached) {
    cached.socket.disconnect();
    cached = null;
  }
}
