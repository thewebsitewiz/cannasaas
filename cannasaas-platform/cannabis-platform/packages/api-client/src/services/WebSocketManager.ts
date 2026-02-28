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
        this.handlers.get(payload.type)?.forEach((h) => h(payload));
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean && this.reconnectAttempts < this.MAX_RECONNECT) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
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

export const wsManager = new WebSocketManager();
