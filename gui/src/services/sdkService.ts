import { UF3SReader } from '@evolve/sdk';

export const createReader = (config) => {
  const reader = new UF3SReader(config);
  reader.connect();
  return reader;
};

export const subscribeToReader = (reader, handlers) => {
  reader.on('tagDetected', handlers.onTagDetected);
  reader.on('connected', handlers.onConnected);
  reader.on('disconnected', handlers.onDisconnected);
  reader.on('error', handlers.onError);
};
