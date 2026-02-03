"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BaseRFIDReader: () => BaseRFIDReader,
  EventBus: () => EventBus,
  PortDiscovery: () => PortDiscovery,
  ReaderState: () => ReaderState,
  SDKEvent: () => SDKEvent,
  SerialTransport: () => SerialTransport,
  TCPTransport: () => TCPTransport,
  UF3SReader: () => UF3SReader
});
module.exports = __toCommonJS(index_exports);

// src/core/EventBus.ts
var import_eventemitter3 = __toESM(require("eventemitter3"));

// src/types/event.ts
var SDKEvent = /* @__PURE__ */ ((SDKEvent2) => {
  SDKEvent2["CONNECTED"] = "connected";
  SDKEvent2["CONNECTING"] = "connecting";
  SDKEvent2["DISCONNECTED"] = "disconnected";
  SDKEvent2["ERROR"] = "error";
  SDKEvent2["TAG_DETECTED"] = "tag_detected";
  SDKEvent2["TAG_LOST"] = "tag_lost";
  SDKEvent2["RAW_DATA"] = "raw_data";
  SDKEvent2["DIAGNOSTIC"] = "diagnostic";
  return SDKEvent2;
})(SDKEvent || {});

// src/core/EventBus.ts
var EventBus = class _EventBus {
  constructor(maxListeners = 100) {
    this.emitter = new import_eventemitter3.default();
    this.listeners = /* @__PURE__ */ new Map();
    this.errorHandlers = /* @__PURE__ */ new Set();
    this.maxListeners = 100;
    this.maxListeners = maxListeners;
  }
  /**
   * Subscribe to an event
   * @param event - The event to listen to
   * @param listener - The callback function
   * @returns Unsubscribe function for convenience
   */
  on(event, listener) {
    this.emitter.on(event, listener);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
    return () => this.off(event, listener);
  }
  /**
   * Subscribe to an event only once
   * @param event - The event to listen to
   * @param listener - The callback function
   */
  once(event, listener) {
    this.emitter.once(event, listener);
  }
  /**
   * Unsubscribe from an event
   * @param event - The event to unsubscribe from
   * @param listener - The callback function to remove
   */
  off(event, listener) {
    this.emitter.off(event, listener);
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(listener);
    }
  }
  /**
   * Emit an event
   * @param event - The event to emit
   * @param payload - The data to send with the event
   */
  emit(event, payload) {
    return this.emitter.emit(event, payload);
  }
  /**
   * Emit an error event
   * @param error - The error to emit
   */
  emitError(error) {
    this.emitter.emit("error" /* ERROR */, error);
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (err) {
        console.error("Error in error handler:", err);
      }
    }
    if (this.listenerCount("error" /* ERROR */) === 0 && this.errorHandlers.size === 0) {
      console.warn("Unhandled SDK error:", error);
    }
  }
  /**
   * Register a global error handler
   * @param handler - The error handler function
   */
  onError(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
  /**
   * Remove all listeners for an event or all events
   * @param event - The specific event to clear, or undefined to clear all
   */
  removeAllListeners(event) {
    if (event) {
      this.emitter.removeAllListeners(event);
      this.listeners.delete(event);
    } else {
      this.emitter.removeAllListeners();
      this.listeners.clear();
    }
  }
  /**
   * Get the number of listeners for an event
   * @param event - The event to check
   */
  listenerCount(event) {
    return this.emitter.listenerCount(event);
  }
  /**
   * Get all events with active listeners
   */
  getActiveEvents() {
    const active = [];
    for (const [event, listeners] of this.listeners.entries()) {
      if (listeners.size > 0) {
        active.push(event);
      }
    }
    return active;
  }
  /**
   * Get listener details for debugging
   */
  getListenerDetails() {
    const details = {};
    for (const [event, listeners] of this.listeners.entries()) {
      if (listeners.size > 0) {
        details[event] = listeners.size;
      }
    }
    return details;
  }
  /**
   * Wait for a specific event to be emitted
   * @param event - The event to wait for
   * @param timeout - Optional timeout in ms
   */
  waitFor(event, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutHandle = null;
      const listener = (payload) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.off(event, listener);
        resolve(payload);
      };
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          this.off(event, listener);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeout);
      }
      this.on(event, listener);
    });
  }
  /**
   * Create a scoped event bus for a specific context
   * Useful for isolated event handling
   */
  createScope() {
    return new _EventBus(this.maxListeners);
  }
  /**
   * Clean up and destroy the event bus
   */
  destroy() {
    this.errorHandlers.clear();
    this.removeAllListeners();
    this.listeners.clear();
  }
};

// src/types/reader.ts
var ReaderState = /* @__PURE__ */ ((ReaderState2) => {
  ReaderState2["IDLE"] = "idle";
  ReaderState2["CONNECTED"] = "connected";
  ReaderState2["CONNECTING"] = "connecting";
  ReaderState2["DISCONNECTED"] = "disconnected";
  ReaderState2["ERROR"] = "error";
  return ReaderState2;
})(ReaderState || {});

// src/core/BaseRFIDReader.ts
var BaseRFIDReader = class {
  constructor(info, transport, eventBus) {
    this.state = "idle" /* IDLE */;
    this.info = info;
    this.transport = transport;
    this.eventBus = eventBus ?? new EventBus();
    this.bindTransportEvents();
  }
  bindTransportEvents() {
    this.transport.onData((data) => this.handleRawData(data));
    this.transport.onError((err) => this.handleError(err));
  }
  async connect() {
    try {
      this.state = "connecting" /* CONNECTING */;
      this.eventBus.emit("connecting" /* CONNECTING */, this.info);
      await this.transport.connect();
      this.state = "connected" /* CONNECTED */;
      this.eventBus.emit("connected" /* CONNECTED */, this.info);
    } catch (err) {
      this.handleError(err);
    }
  }
  async disconnect() {
    await this.transport.disconnect();
    this.state = "disconnected" /* DISCONNECTED */;
    this.eventBus.emit("disconnected" /* DISCONNECTED */, this.info);
  }
  handleRawData(data) {
    this.eventBus.emit("raw_data" /* RAW_DATA */, data);
    this.parse(data);
  }
  handleError(err) {
    this.state = "error" /* ERROR */;
    const sdkError = {
      code: "READER_ERROR",
      message: err.message,
      source: this.info.model,
      raw: err
    };
    this.eventBus.emitError(sdkError);
  }
  getState() {
    return this.state;
  }
  getInfo() {
    return this.info;
  }
  getEventBus() {
    return this.eventBus;
  }
};

// src/transports/SerialTransport.ts
var import_serialport = require("serialport");
var SerialTransport = class {
  constructor(path, baudRate = 115200, options) {
    this.baudRate = baudRate;
    this.options = options;
    this.dataCallback = null;
    this.errorCallback = null;
    this.connected = false;
    this.port = new import_serialport.SerialPort({
      path,
      baudRate,
      dataBits: options?.dataBits ?? 8,
      stopBits: options?.stopBits ?? 1,
      parity: options?.parity ?? "none",
      autoOpen: false
    });
    this.setupEventHandlers();
  }
  setupEventHandlers() {
    this.port.on("data", (data) => {
      this.dataCallback?.(data);
    });
    this.port.on("error", (err) => {
      this.connected = false;
      this.errorCallback?.(err);
    });
    this.port.on("close", () => {
      this.connected = false;
    });
    this.port.on("open", () => {
      this.connected = true;
    });
  }
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) return resolve();
      this.port.open((err) => {
        if (err) {
          this.connected = false;
          return reject(new Error(`Failed to open serial port: ${err.message}`));
        }
        this.connected = true;
        resolve();
      });
    });
  }
  disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.connected) return resolve();
      this.port.close((err) => {
        if (err) {
          return reject(new Error(`Failed to close serial port: ${err.message}`));
        }
        this.connected = false;
        resolve();
      });
    });
  }
  send(data) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.port.isOpen) {
        return reject(new Error("Serial port not open"));
      }
      this.port.write(data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  onData(callback) {
    this.dataCallback = callback;
  }
  onError(callback) {
    this.errorCallback = callback;
  }
  isConnected() {
    return this.connected && this.port.isOpen;
  }
  /**
   * Get list of available serial ports
   * Useful for discovering connected RFID readers
   */
  static async listPorts() {
    try {
      return await import_serialport.SerialPort.list();
    } catch (err) {
      throw new Error(`Failed to list serial ports: ${err.message}`);
    }
  }
};

// src/transports/TCPTransport.ts
var import_net = __toESM(require("net"));
var TCPTransport = class {
  constructor(host, port, options) {
    this.options = options;
    this.connected = false;
    this.dataCallback = null;
    this.errorCallback = null;
    this.host = host;
    this.port = port;
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new import_net.default.Socket();
      this.socket.on("connect", () => {
        this.connected = true;
        resolve();
      });
      this.socket.on("data", (data) => {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        this.dataCallback?.(buffer);
      });
      this.socket.on("error", (err) => {
        this.errorCallback?.(err);
        reject(err);
      });
      this.socket.on("close", () => {
        this.connected = false;
      });
      this.socket.connect(this.port, this.host);
    });
  }
  disconnect() {
    return new Promise((resolve) => {
      if (!this.socket) return resolve();
      this.socket.once("close", () => {
        this.connected = false;
        resolve();
      });
      this.socket.end();
      this.socket.destroy();
    });
  }
  send(data) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) return reject(new Error("TCP not connected"));
      this.socket.write(data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  onData(callback) {
    this.dataCallback = callback;
  }
  onError(callback) {
    this.errorCallback = callback;
  }
  isConnected() {
    return this.connected;
  }
};

// src/readers/UF3SReader.ts
var UF3SReader = class extends BaseRFIDReader {
  constructor() {
    super(...arguments);
    this.buffer = "";
  }
  parse(data) {
    this.buffer += data.toString("utf-8");
    let index;
    while ((index = this.buffer.indexOf("\r\n")) >= 0) {
      const rawTag = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + 2);
      if (rawTag) {
        this.getEventBus().emit("tag_detected" /* TAG_DETECTED */, {
          tagId: rawTag,
          reader: this.getInfo(),
          timestamp: /* @__PURE__ */ new Date()
        });
      }
    }
  }
};

// src/diagnostics/PortDiscovery.ts
var PortDiscovery = class {
  /**
   * List all available serial ports
   */
  static async listSerialPorts() {
    try {
      return await SerialTransport.listPorts();
    } catch (err) {
      console.error("Error listing serial ports:", err);
      return [];
    }
  }
  /**
   * Scan for TCP readers on a network range
   * @param startIP - Starting IP address (e.g., "192.168.1.1")
   * @param endIP - Ending IP address (e.g., "192.168.1.255")
   * @param port - Port to scan (default 8088 for UF3-S)
   * @param timeout - Connection timeout in ms (default 1000)
   */
  static async scanTCPNetwork(startIP, endIP, port = 8088, timeout = 1e3) {
    const foundReaders = [];
    const ips = this.generateIPRange(startIP, endIP);
    const scanPromises = ips.map(
      (ip) => this.testTCPConnection(ip, port, timeout).then((success) => {
        if (success) {
          foundReaders.push({
            id: `tcp-${ip}-${port}`,
            model: "UF3-S",
            transport: "tcp",
            address: ip,
            port
          });
        }
      }).catch(() => {
      })
    );
    await Promise.all(scanPromises);
    return foundReaders;
  }
  /**
   * Test TCP connection to a specific address
   */
  static testTCPConnection(host, port, timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout);
      const transport = new TCPTransport(host, port);
      transport.connect().then(() => {
        clearTimeout(timer);
        transport.disconnect();
        resolve(true);
      }).catch(() => {
        clearTimeout(timer);
        resolve(false);
      });
    });
  }
  /**
   * Generate array of IP addresses from range
   */
  static generateIPRange(startIP, endIP) {
    const ips = [];
    const [start1, start2, start3, start4] = startIP.split(".").map(Number);
    const [end1, end2, end3, end4] = endIP.split(".").map(Number);
    for (let i = start4; i <= end4; i++) {
      ips.push(`${start1}.${start2}.${start3}.${i}`);
    }
    return ips;
  }
  /**
   * Get suggested reader configuration from discovered port
   */
  static createReaderInfo(path, model = "UF3-S", transport = "serial") {
    return {
      id: `${transport}-${path}`,
      model,
      transport,
      address: path,
      ...transport === "tcp" && { port: 8088 }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseRFIDReader,
  EventBus,
  PortDiscovery,
  ReaderState,
  SDKEvent,
  SerialTransport,
  TCPTransport,
  UF3SReader
});
//# sourceMappingURL=index.js.map