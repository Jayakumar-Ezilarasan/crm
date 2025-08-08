export type WebSocketEvent = 'open' | 'close' | 'error' | 'message';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: { [K in WebSocketEvent]?: ((event: any) => void)[] } = {};
  private reconnectTimeout: number = 3000;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = (e) => this.emit('open', e);
    this.ws.onclose = (e) => {
      this.emit('close', e);
      if (this.shouldReconnect) setTimeout(() => this.connect(), this.reconnectTimeout);
    };
    this.ws.onerror = (e) => this.emit('error', e);
    this.ws.onmessage = (e) => this.emit('message', e);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    this.ws?.readyState === WebSocket.OPEN && this.ws.send(data);
  }

  on(event: WebSocketEvent, cb: (event: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(cb);
  }

  private emit(event: WebSocketEvent, e: any) {
    this.listeners[event]?.forEach(cb => cb(e));
  }
} 