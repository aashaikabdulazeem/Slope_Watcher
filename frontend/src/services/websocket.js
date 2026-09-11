class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.reconnectDelay = 2000;
    this.status = 'DISCONNECTED'; // CONNECTING, CONNECTED, DISCONNECTED
    this.pingInterval = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this._setStatus('CONNECTING');

    // Build URL from current window location if not provided
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // When running under vite dev proxy, /ws connects through Vite proxy
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this._setStatus('CONNECTED');
        this.reconnectDelay = 2000;
        
        // Start ping heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send("ping");
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          const data = JSON.parse(event.data);
          this._notifyListeners(data);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e, event.data);
        }
      };

      this.ws.onclose = () => {
        this._setStatus('DISCONNECTED');
        this._cleanup();
        this._scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket encounter error:", err);
        this.ws.close();
      };
    } catch (e) {
      this._setStatus('DISCONNECTED');
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this._cleanup();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setStatus('DISCONNECTED');
  }

  _cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
      this.connect();
    }, this.reconnectDelay);
  }

  _setStatus(newStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  _notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (e) {
        console.error("Error in WS listener callback:", e);
      }
    });
  }
}

export const wsClient = new WebSocketClient();
