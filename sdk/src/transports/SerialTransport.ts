import { ITransport, TransportOptions } from './ITransport';
import { SerialPort } from 'serialport';

export class SerialTransport implements ITransport {
  private port: SerialPort;
  private dataCallback: ((data: Buffer) => void) | null = null;
  private errorCallback: ((err: Error) => void) | null = null;

  constructor(path: string, private baudRate = 115200, private options?: TransportOptions) {
    this.port = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
    });

    this.port.on('data', (data) => this.dataCallback?.(data));
    this.port.on('error', (err) => this.errorCallback?.(err));
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.port.isOpen) return resolve();
      this.port.close(() => resolve());
    });
  }

send(data: Buffer | string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!this.port.isOpen) return reject(new Error('Serial port not open'));

    const bufferToSend = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

    this.port.write(bufferToSend, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}


  onData(callback: (data: Buffer) => void): void {
    this.dataCallback = callback;
  }

  onError(callback: (err: Error) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.port.isOpen;
  }
}
