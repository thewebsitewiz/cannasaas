#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Section 11: Real-Time WebSocket Architecture
#
# Writes the WebSocket singleton and React hook into packages/api-client.
# Safe to re-run — existing files are overwritten.
#
# Files written (2):
#   packages/api-client/src/services/WebSocketManager.ts
#   packages/api-client/src/hooks/useWebSocketEvent.ts
#
# Usage:
#   chmod +x setup-section11-ws.zsh
#   ./setup-section11-ws.zsh                   # ~/cannasaas-platform
#   ./setup-section11-ws.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas — Section 11: Real-Time WebSocket Architecture%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── 1. Directories ────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}/packages/api-client/src/hooks"
mkdir -p "${PLATFORM_ROOT}/packages/api-client/src/services"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── 2. Source files ───────────────────────────────────────────────

# [01/2] services/WebSocketManager.ts
print -P "%F{cyan}  [01/2] services/WebSocketManager.ts%f"
cat > "${PLATFORM_ROOT}/packages/api-client/src/services/WebSocketManager.ts" << 'FILE_EOF'
// packages/api-client/src/services/WebSocketManager.ts
type EventHandler = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url = '';
  private accessToken = '';

  connect(url: string, accessToken: string): void {
    this.url = url;
    this.accessToken = accessToken;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${this.url}?token=${this.accessToken}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.info('[WS] Connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as { type: string };
        const handlers = this.handlers.get(payload.type);
        handlers?.forEach((handler) => handler(payload));
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean && this.reconnectAttempts < this.MAX_RECONNECT) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          this.openConnection();
        }, delay);
      }
    };
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return an unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'User disconnected');
    this.ws = null;
    this.handlers.clear();
  }
}

// Singleton export
export const wsManager = new WebSocketManager();
FILE_EOF

# [02/2] hooks/useWebSocketEvent.ts
print -P "%F{cyan}  [02/2] hooks/useWebSocketEvent.ts%f"
cat > "${PLATFORM_ROOT}/packages/api-client/src/hooks/useWebSocketEvent.ts" << 'FILE_EOF'
// packages/api-client/src/hooks/useWebSocketEvent.ts
import { useEffect, useRef, useCallback } from 'react';
import { wsManager } from '../services/WebSocketManager';

/**
 * useWebSocketEvent — Subscribe to a specific WebSocket event type
 *
 * Handles subscription and automatic cleanup on unmount.
 * Uses a ref for the handler to avoid stale closure issues.
 */
export function useWebSocketEvent<T>(
  eventType: string,
  handler: (data: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: unknown) => {
    handlerRef.current(data as T);
  }, []);

  useEffect(() => {
    const unsubscribe = wsManager.on(eventType, stableHandler);
    return unsubscribe;
  }, [eventType, stableHandler]);
}
FILE_EOF

# ── 3. Summary ────────────────────────────────────────────────────
echo ""
print -P "%F{green}✓  Done — 2 files written to ${PLATFORM_ROOT}/packages/api-client/src%f"
echo ""
print -P "%F{cyan}Directory tree:%f"
if command -v tree &>/dev/null; then
  tree "${PLATFORM_ROOT}/packages/api-client/src"
else
  find "${PLATFORM_ROOT}/packages/api-client/src" -type f | sort | \
    sed "s|${PLATFORM_ROOT}/||"
fi

