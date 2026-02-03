declare enum SDKEvent {
    CONNECTED = "connected",
    CONNECTING = "connecting",
    DISCONNECTED = "disconnected",
    ERROR = "error",
    TAG_DETECTED = "tag_detected",
    TAG_LOST = "tag_lost",
    RAW_DATA = "raw_data",
    DIAGNOSTIC = "diagnostic"
}
interface SDKError {
    code: string;
    message: string;
    source?: string;
    raw?: unknown;
}

declare class EventBus {
    private emitter;
    on(event: SDKEvent, listener: (...args: any[]) => void): void;
    off(event: SDKEvent, listener: (...args: any[]) => void): void;
    emit(event: SDKEvent, payload?: unknown): void;
    emitError(error: SDKError): void;
    removeAll(): void;
}

declare enum ReaderState {
    IDLE = "idle",
    CONNECTED = "connected",
    CONNECTING = "connecting",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
interface ReaderInfo {
    id: string;
    model: string;
    transport: 'tcp' | 'serial';
    address: string;
    port?: number;
}

interface TransportOptions {
    timeout?: number;
}
interface ITransport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(data: Buffer): Promise<void>;
    onData(callback: (data: Buffer) => void): void;
    onError(callback: (error: Error) => void): void;
    isConnected(): boolean;
}

declare abstract class BaseRFIDReader {
    protected eventBus: EventBus;
    protected transport: ITransport;
    protected state: ReaderState;
    protected info: ReaderInfo;
    constructor(info: ReaderInfo, transport: ITransport, eventBus?: EventBus);
    private bindTransportEvents;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected handleRawData(data: Buffer): void;
    protected handleError(err: Error): void;
    getState(): ReaderState;
    getInfo(): ReaderInfo;
    getEventBus(): EventBus;
    /** Reader-specific protocol parsing */
    protected abstract parse(data: Buffer): void;
}

declare class SerialTransport implements ITransport {
    private baudRate;
    private options?;
    private port;
    private dataCallback;
    private errorCallback;
    constructor(path: string, baudRate?: number, options?: TransportOptions | undefined);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(data: Buffer | string): Promise<void>;
    onData(callback: (data: Buffer) => void): void;
    onError(callback: (err: Error) => void): void;
    isConnected(): boolean;
}

declare class TCPTransport implements ITransport {
    private options?;
    private host;
    private port;
    private socket?;
    private connected;
    private dataCallback;
    private errorCallback;
    constructor(host: string, port: number, options?: TransportOptions | undefined);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(data: Buffer): Promise<void>;
    onData(callback: (data: Buffer) => void): void;
    onError(callback: (err: Error) => void): void;
    isConnected(): boolean;
}

/**
 * UF3-S Reader Protocol:
 * - Sends tag data as fixed-length packets
 * - Each tag usually ends with \r\n
 * - Example: "E2000017221101441890\r\n"
 */
declare class UF3SReader extends BaseRFIDReader {
    private buffer;
    protected parse(data: Buffer): void;
}

export { BaseRFIDReader, EventBus, type ITransport, type ReaderInfo, ReaderState, type SDKError, SDKEvent, SerialTransport, TCPTransport, type TransportOptions, UF3SReader };
