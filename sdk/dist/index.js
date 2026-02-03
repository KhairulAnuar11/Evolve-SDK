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
var EventBus = class {
  constructor() {
    this.emitter = new import_eventemitter3.default();
  }
  on(event, listener) {
    this.emitter.on(event, listener);
  }
  off(event, listener) {
    this.emitter.off(event, listener);
  }
  emit(event, payload) {
    this.emitter.emit(event, payload);
  }
  emitError(error) {
    this.emitter.emit("error" /* ERROR */, error);
  }
  removeAll() {
    this.emitter.removeAllListeners();
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
    this.port = new import_serialport.SerialPort({
      path,
      baudRate,
      autoOpen: false
    });
    this.port.on("data", (data) => this.dataCallback?.(data));
    this.port.on("error", (err) => this.errorCallback?.(err));
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  disconnect() {
    return new Promise((resolve) => {
      if (!this.port.isOpen) return resolve();
      this.port.close(() => resolve());
    });
  }
  send(data) {
    return new Promise((resolve, reject) => {
      if (!this.port.isOpen) return reject(new Error("Serial port not open"));
      const bufferToSend = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
      this.port.write(bufferToSend, (err) => {
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
    return this.port.isOpen;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseRFIDReader,
  EventBus,
  ReaderState,
  SDKEvent,
  SerialTransport,
  TCPTransport,
  UF3SReader
});
//# sourceMappingURL=index.js.map