import { SerialPort } from 'serialport';
import { ReaderManager } from '../readers/ReaderManager';
import { A0Protocol } from '../utils/A0Protocol';

export class SerialReader extends ReaderManager {
  private port?: SerialPort;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(private path: string, private baud: number, emitter: any) { super(emitter); }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port = new SerialPort({ path: this.path, baudRate: this.baud, autoOpen: false });
      this.port.open((err) => {
        if (err) return reject(err);
        console.log(`[SerialReader] Connected to ${this.path}`);
        this.port?.on('data', (data) => this.handleIncomingData(data));
        resolve();
      });
    });
  }

  // Uses the same handleIncomingData and processFrame as TCP
  private handleIncomingData(data: Buffer) { /* Same as TcpReader */ }
  private processFrame(frame: Buffer) { /* Same as TcpReader */ }

  async readTag(): Promise<any> {
    // Implement tag reading logic here
    return new Promise((resolve) => {
      // This will be resolved when a tag is detected in processFrame
      resolve(null);
    });
  }

  startScan() { this.port?.write(A0Protocol.encode(0x01, 0x89, [0xFF])); }
  stopScan() { this.port?.write(A0Protocol.encode(0x01, 0x8C)); }
  async disconnect() { if (this.port?.isOpen) this.port.close(); }
}