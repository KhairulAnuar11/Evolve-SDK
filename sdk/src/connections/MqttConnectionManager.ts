/**
 * MQTT Connection Manager
 * 
 * Handles MQTT broker connections with comprehensive configuration options
 * including authentication, TLS, and connection monitoring.
 */

import mqtt from 'mqtt';

export interface MqttConnectionConfig {
  brokerUrl: string;
  topic: string;
  username?: string;
  password?: string;
  clientId?: string;
  keepalive?: number;
  reconnectPeriod?: number;
  connectTimeout?: number;
  rejectUnauthorized?: boolean;
  protocol?: 'mqtt' | 'mqtts' | 'tcp' | 'tls' | 'ws' | 'wss';
  [key: string]: any;
}

export interface MqttConnectionStatus {
  connected: boolean;
  brokerUrl: string;
  topic: string;
  error?: string;
  lastConnected?: number;
}

export class MqttConnectionManager {
  private client?: mqtt.MqttClient;
  private config?: MqttConnectionConfig;
  private status: MqttConnectionStatus = {
    connected: false,
    brokerUrl: '',
    topic: '',
  };
  private connectionListeners: ((status: MqttConnectionStatus) => void)[] = [];
  private messageListeners: ((topic: string, payload: Buffer) => void)[] = [];

  /**
   * Establish MQTT connection with provided configuration
   */
  async connect(config: MqttConnectionConfig): Promise<MqttConnectionStatus> {
    try {
      // Validate configuration
      if (!config.brokerUrl || !config.topic) {
        throw new Error('brokerUrl and topic are required');
      }

      this.config = config;

      // Normalize and validate broker URL early to avoid DNS lookup of invalid values
      let normalizedUrl = config.brokerUrl;
      try {
        const candidate = config.brokerUrl.includes('://') ? config.brokerUrl : `mqtt://${config.brokerUrl}`;
        const parsed = new URL(candidate);
        if (!parsed.hostname || /^\d+$/.test(parsed.hostname)) {
          throw new Error('Invalid broker URL: missing hostname');
        }
        // If user wants to force protocol, apply it
        if (config.protocol) parsed.protocol = `${config.protocol}:`;
        normalizedUrl = parsed.toString();
      } catch (err) {
        throw new Error(`Invalid brokerUrl format: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Build MQTT client options
      const clientOptions: mqtt.IClientOptions = {
        clientId: config.clientId || `evolve-sdk-${Date.now()}`,
        keepalive: config.keepalive ?? 30,
        reconnectPeriod: config.reconnectPeriod ?? 1000,
        connectTimeout: config.connectTimeout ?? 30000,
        rejectUnauthorized: config.rejectUnauthorized ?? true,
      };

      // Add authentication if provided
      if (config.username) {
        clientOptions.username = config.username;
      }
      if (config.password) {
        clientOptions.password = config.password;
      }

      // Allow custom protocol override
      // Use normalized URL for connection (already applied protocol if requested)
      return new Promise((resolve, reject) => {
        this.client = mqtt.connect(normalizedUrl, clientOptions);
        this.setupClientListeners(config.topic, resolve, reject);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.status = {
        connected: false,
        brokerUrl: config?.brokerUrl || '',
        topic: config?.topic || '',
        error: errorMsg,
      };
      this.notifyListeners();
      throw err;
    }
  }

  /**
   * Set up MQTT client event listeners
   */
  private setupClientListeners(
    topic: string,
    resolve: (status: MqttConnectionStatus) => void,
    reject: (err: Error) => void
  ) {
    if (!this.client) return;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      const error = new Error('MQTT connection timeout');
      this.status = {
        connected: false,
        brokerUrl: this.config?.brokerUrl || '',
        topic,
        error: error.message,
      };
      this.notifyListeners();
      if (this.client) {
        this.client.end(true);
        this.client = undefined;
      }
      reject(error);
    }, (this.config?.connectTimeout ?? 30000) + 1000);

    this.client.once('connect', () => {
      if (resolved) return;
      clearTimeout(timeout);
      
      this.client!.subscribe(topic, (err) => {
        if (resolved) return;
        if (err) {
          resolved = true;
          this.status = {
            connected: false,
            brokerUrl: this.config?.brokerUrl || '',
            topic,
            error: `Subscribe failed: ${err.message}`,
          };
          this.notifyListeners();
          reject(err);
          return;
        }

        resolved = true;
        this.status = {
          connected: true,
          brokerUrl: this.config?.brokerUrl || '',
          topic,
          lastConnected: Date.now(),
        };
        this.notifyListeners();
        resolve(this.status);
      });
    });

    this.client.once('error', (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      this.status = {
        connected: false,
        brokerUrl: this.config?.brokerUrl || '',
        topic,
        error: `Connection error: ${err.message}`,
      };
      this.notifyListeners();
      if (this.client) {
        this.client.end(true);
        this.client = undefined;
      }
      reject(err);
    });

    // Some lower-level socket/stream errors may not be forwarded through
    // the mqtt client's 'error' event consistently on all transports.
    // Also attach an error listener on the underlying stream/socket to
    // ensure we catch ECONNABORTED / write errors and handle them gracefully
    try {
      const stream: any = (this.client as any)?.stream;
      if (stream && typeof stream.on === 'function') {
        stream.on('error', (err: any) => {
          // If not resolved yet, reject the connect promise
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.status = {
              connected: false,
              brokerUrl: this.config?.brokerUrl || '',
              topic,
              error: `Stream error: ${err?.message || String(err)}`,
            };
            this.notifyListeners();
            try { this.client?.end(true); } catch (e) {}
            this.client = undefined;
            reject(err);
            return;
          }

          // If already connected, update status and attempt graceful disconnect
          this.status.error = err?.message || String(err);
          this.status.connected = false;
          this.notifyListeners();
          try { this.client?.end(true); } catch (e) {}
          this.client = undefined;
        });
      }
    } catch (e) {
      // Non-fatal: if we cannot attach to the stream, continue; client 'error'
      // listener will still catch most error conditions.
    }

    this.client.on('message', (receivedTopic, payload) => {
      // Notify message listeners
      this.messageListeners.forEach(listener => listener(receivedTopic, payload));
    });

    this.client.on('error', (err) => {
      if (this.status.connected) {
        console.error('[MqttConnectionManager] Connection error:', err);
      }
      this.status.error = err.message || String(err);
      this.notifyListeners();
    });

    this.client.on('close', () => {
      if (this.status.connected) {
        this.status.connected = false;
        this.notifyListeners();
      }
    });

    this.client.on('disconnect', () => {
      this.status.connected = false;
      this.notifyListeners();
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, {}, () => {
          this.client = undefined;
          this.status = {
            connected: false,
            brokerUrl: this.config?.brokerUrl || '',
            topic: this.config?.topic || '',
          };
          this.notifyListeners();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Publish a message to the MQTT broker
   */
  async publish(
    payload: string | Buffer | object,
    topic?: string,
    options?: mqtt.IClientPublishOptions
  ): Promise<void> {
    if (!this.client || !this.status.connected) {
      throw new Error('MQTT client is not connected');
    }

    const targetTopic = topic ?? this.config?.topic;
    if (!targetTopic) {
      throw new Error('No topic specified');
    }

    let finalPayload: string | Buffer;
    if (typeof payload === 'string') {
      finalPayload = payload;
    } else if (Buffer.isBuffer(payload)) {
      finalPayload = payload;
    } else {
      finalPayload = JSON.stringify(payload);
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(targetTopic, finalPayload, options ?? {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(listener: (status: MqttConnectionStatus) => void): () => void {
    this.connectionListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to incoming messages
   */
  onMessage(listener: (topic: string, payload: Buffer) => void): () => void {
    this.messageListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): MqttConnectionStatus {
    return { ...this.status };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners() {
    this.connectionListeners.forEach(listener => listener(this.getStatus()));
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.status.connected;
  }

  /**
   * Test connection without subscribing to messages
   */
  static async testConnection(config: MqttConnectionConfig): Promise<{ success: boolean; message: string }> {
    const manager = new MqttConnectionManager();
    try {
      const status = await manager.connect(config);
      await manager.disconnect();
      return {
        success: status.connected,
        message: 'Connection successful',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
