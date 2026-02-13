// src/RfidSdk.ts
import { RfidEventEmitter } from './events/RfidEvents';
import { ReaderManager } from './readers/ReaderManager';
import { TcpReader } from './transports/TCPTransport';
import { MqttReader } from './transports/MQTTTransport';
import { formatPayload } from './payloads/PayloadFormatter';

export class RfidSdk {
  private emitter = new RfidEventEmitter();
  private reader?: ReaderManager;
  private events: Record<string, Function> = {};

  // --- EVENT HANDLING ---
  on(event: string, callback: (...args: any[]) => void) {
    // allow GUI or other consumers to listen to SDK events
    this.emitter.on(event, callback);
  }

  private emit(event: string, data?: any) {
    this.emitter.emit(event, data);
  }

  // --- CONNECT / DISCONNECT ---
  async connectTcp(host: string, port: number) {
    this.reader = new TcpReader(host, port, this.emitter);
    await this.reader.connect();
    return true;
  }

  async connectMqtt(brokerUrl: string, topic: string, options?: any) {
    this.reader = new MqttReader(brokerUrl, topic, this.emitter, options);
    await this.reader.connect();
    return true;
  }

  async disconnect() {
    await this.reader?.disconnect();
    this.reader = undefined;
  }

  // --- CONFIGURE READER ---
  async configure(settings: Record<string, any>) {
    await this.reader?.configure(settings);
  }

  // --- START / STOP SCAN ---
    start() {
      if (!this.reader) return;

      this.reader.on('tagRead', (tag: any) => {
        const formatted = formatPayload(tag);
        this.emit('tag', formatted);
      });

      this.reader.startScan();
    }

  stop() {
    if (!this.reader) return;

    // If reader supports stopScan(), call it
    this.reader.stopScan();
  }

  async publish(tag: any, topic?: string) {
    if (!this.reader) throw new Error('No reader connected');
    const pub = (this.reader as any).publish;
    if (typeof pub !== 'function') throw new Error('Connected reader does not support publish');
    return await pub.call(this.reader, tag, topic);
  }
}
