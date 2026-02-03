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

/**
 * Type-safe event listener signatures
 */
interface EventListeners {
    [SDKEvent.CONNECTED]: (info: any) => void;
    [SDKEvent.CONNECTING]: (info: any) => void;
    [SDKEvent.DISCONNECTED]: (info: any) => void;
    [SDKEvent.ERROR]: (error: SDKError) => void;
    [SDKEvent.TAG_DETECTED]: (data: any) => void;
    [SDKEvent.TAG_LOST]: (data: any) => void;
    [SDKEvent.RAW_DATA]: (data: Buffer) => void;
    [SDKEvent.DIAGNOSTIC]: (data: any) => void;
}
/**
 * Enhanced EventBus with proper event handling
 * Provides type-safe event emission and subscription
 */
declare class EventBus {
    private emitter;
    private listeners;
    private errorHandlers;
    private maxListeners;
    constructor(maxListeners?: number);
    /**
     * Subscribe to an event
     * @param event - The event to listen to
     * @param listener - The callback function
     * @returns Unsubscribe function for convenience
     */
    on<E extends SDKEvent>(event: E, listener: EventListeners[E]): () => void;
    /**
     * Subscribe to an event only once
     * @param event - The event to listen to
     * @param listener - The callback function
     */
    once<E extends SDKEvent>(event: E, listener: EventListeners[E]): void;
    /**
     * Unsubscribe from an event
     * @param event - The event to unsubscribe from
     * @param listener - The callback function to remove
     */
    off<E extends SDKEvent>(event: E, listener: EventListeners[E]): void;
    /**
     * Emit an event
     * @param event - The event to emit
     * @param payload - The data to send with the event
     */
    emit<E extends SDKEvent>(event: E, payload?: any): boolean;
    /**
     * Emit an error event
     * @param error - The error to emit
     */
    emitError(error: SDKError): void;
    /**
     * Register a global error handler
     * @param handler - The error handler function
     */
    onError(handler: (error: SDKError) => void): () => void;
    /**
     * Remove all listeners for an event or all events
     * @param event - The specific event to clear, or undefined to clear all
     */
    removeAllListeners(event?: SDKEvent): void;
    /**
     * Get the number of listeners for an event
     * @param event - The event to check
     */
    listenerCount(event: SDKEvent): number;
    /**
     * Get all events with active listeners
     */
    getActiveEvents(): SDKEvent[];
    /**
     * Get listener details for debugging
     */
    getListenerDetails(): Record<string, number>;
    /**
     * Wait for a specific event to be emitted
     * @param event - The event to wait for
     * @param timeout - Optional timeout in ms
     */
    waitFor<E extends SDKEvent>(event: E, timeout?: number): Promise<any>;
    /**
     * Create a scoped event bus for a specific context
     * Useful for isolated event handling
     */
    createScope(): EventBus;
    /**
     * Clean up and destroy the event bus
     */
    destroy(): void;
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

interface SerialTransportOptions extends TransportOptions {
    dataBits?: 8 | 7 | 6 | 5;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
}
/**
 * Serial Port Transport Implementation
 * Handles communication with RFID readers via RS-232/RS-485 serial connections
 */
declare class SerialTransport implements ITransport {
    private baudRate;
    private options?;
    private port;
    private dataCallback;
    private errorCallback;
    private connected;
    constructor(path: string, baudRate?: number, options?: SerialTransportOptions | undefined);
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(data: Buffer): Promise<void>;
    onData(callback: (data: Buffer) => void): void;
    onError(callback: (err: Error) => void): void;
    isConnected(): boolean;
    /**
     * Get list of available serial ports
     * Useful for discovering connected RFID readers
     */
    static listPorts(): Promise<Array<{
        path: string;
        manufacturer?: string;
    }>>;
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

/**
 * Port Discovery Utility
 * Helps discover and list available serial and TCP ports
 */
declare class PortDiscovery {
    /**
     * List all available serial ports
     */
    static listSerialPorts(): Promise<Array<{
        path: string;
        manufacturer?: string;
    }>>;
    /**
     * Scan for TCP readers on a network range
     * @param startIP - Starting IP address (e.g., "192.168.1.1")
     * @param endIP - Ending IP address (e.g., "192.168.1.255")
     * @param port - Port to scan (default 8088 for UF3-S)
     * @param timeout - Connection timeout in ms (default 1000)
     */
    static scanTCPNetwork(startIP: string, endIP: string, port?: number, timeout?: number): Promise<ReaderInfo[]>;
    /**
     * Test TCP connection to a specific address
     */
    private static testTCPConnection;
    /**
     * Generate array of IP addresses from range
     */
    private static generateIPRange;
    /**
     * Get suggested reader configuration from discovered port
     */
    static createReaderInfo(path: string, model?: string, transport?: 'serial' | 'tcp'): ReaderInfo;
}

export { BaseRFIDReader, EventBus, type EventListeners, type ITransport, PortDiscovery, type ReaderInfo, ReaderState, type SDKError, SDKEvent, SerialTransport, type SerialTransportOptions, TCPTransport, type TransportOptions, UF3SReader };
