import EventEmitter from "eventemitter3";
import { SDKEvent, SDKError } from "../types/event";
import { off } from "node:cluster";

export class EventBus {
    private emitter = new EventEmitter();

    on(event: SDKEvent, listener: (...args: any[]) => void): void {
        this.emitter.on(event, listener);
    }

    off(event: SDKEvent, listener: (...args: any[]) => void): void {
        this.emitter.off(event, listener);
    }

    emit(event: SDKEvent, payload?: unknown): void {
        this.emitter.emit(event, payload);
    }

    emitError(error: SDKError): void {
        this.emitter.emit(SDKEvent.ERROR, error);
    }

    removeAll(): void {
        this.emitter.removeAllListeners();
    }
}

