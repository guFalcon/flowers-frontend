/**
 * SSE Connection Manager with automatic reconnection
 * Handles Server-Sent Events with robust error handling and reconnection logic
 */
class SSEConnectionManager {
  constructor(url, options = {}) {
    this.url = url;
    this.eventSource = null;
    this.reconnectInterval = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    // Configuration
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.initialReconnectDelay = options.initialReconnectDelay || 1000; // 1 second
    this.maxReconnectDelay = options.maxReconnectDelay || 30000; // 30 seconds
    
    // Event handlers
    this.onConnectionChange = options.onConnectionChange || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    
    this.setupVisibilityHandlers();
  }

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  getReconnectDelay() {
    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts), 
      this.maxReconnectDelay
    );
    return delay + (Math.random() * 1000); // Add up to 1 second of jitter
  }

  /**
   * Update connection status and notify listeners
   */
  updateStatus(status, message) {
    console.log(`SSE Status: ${status} - ${message}`);
    this.onConnectionChange(status, message);
  }

  /**
   * Connect to SSE endpoint
   */
  connect() {
    try {
      console.log('Attempting to connect to SSE...');
      this.updateStatus('connecting', '🔄 Connecting...');
      
      this.eventSource = new EventSource(this.url);
      
      this.eventSource.onopen = () => {
        console.log('SSE connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateStatus('connected', '🟢 Connected');
        
        if (this.reconnectInterval) {
          clearTimeout(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          this.onMessage(data, event);
        } catch (e) {
          console.error('Error parsing SSE message:', e);
          this.onError(e, 'parse_error');
        }
      };

      this.eventSource.onerror = (event) => {
        console.warn('SSE connection error:', event);
        this.isConnected = false;
        this.updateStatus('disconnected', '🔴 Disconnected');
        this.onError(event, 'connection_error');
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE connection closed, attempting to reconnect...');
          this.scheduleReconnect();
        }
      };

    } catch (e) {
      console.error("Failed to create EventSource:", e);
      this.isConnected = false;
      this.updateStatus('error', '🔴 Connection Failed');
      this.onError(e, 'creation_error');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      this.updateStatus('failed', '🔴 Connection Lost');
      return;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    const delay = this.getReconnectDelay();
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${Math.round(delay/1000)}s...`);
    this.updateStatus('reconnecting', `🔄 Reconnecting in ${Math.round(delay/1000)}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.disconnect(false); // Don't update status, we're reconnecting
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from SSE
   */
  disconnect(updateStatus = true) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    this.isConnected = false;
    
    if (updateStatus) {
      this.updateStatus('disconnected', '🔴 Disconnected');
    }
  }

  /**
   * Setup page visibility change handlers
   */
  setupVisibilityHandlers() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden, SSE will be handled by browser');
      } else {
        console.log('Page visible again');
        // If connection seems lost, try to reconnect
        if (!this.isConnected && !this.reconnectInterval) {
          console.log('Connection lost while page was hidden, reconnecting...');
          this.reconnectAttempts = 0; // Reset attempts when page becomes visible
          this.connect();
        }
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasReconnectScheduled: this.reconnectInterval !== null
    };
  }

  /**
   * Force reconnection (resets attempt counter)
   */
  forceReconnect() {
    this.reconnectAttempts = 0;
    this.disconnect(false);
    this.connect();
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SSEConnectionManager;
} else if (typeof window !== 'undefined') {
  window.SSEConnectionManager = SSEConnectionManager;
}