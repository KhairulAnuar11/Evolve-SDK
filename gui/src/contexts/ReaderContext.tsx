// src/contexts/ReaderContext.tsx
import { createContext, useState, ReactNode } from 'react';
import { UF3SReader } from '@evolve/sdk';

interface ReaderContextType {
  readers: UF3SReader[];
  addReader: (reader: UF3SReader) => void;
  removeReader: (reader: UF3SReader) => void;
}

export const ReaderContext = createContext<ReaderContextType>({
  readers: [],
  addReader: () => {},
  removeReader: () => {}
});

export const ReaderProvider = ({ children }: { children: ReactNode }) => {
  const [readers, setReaders] = useState<UF3SReader[]>([]);

  const addReader = (reader: UF3SReader) => setReaders((prev) => [...prev, reader]);
  const removeReader = (reader: UF3SReader) =>
    setReaders((prev) => prev.filter((r) => r !== reader));

  return (
    <ReaderContext.Provider value={{ readers, addReader, removeReader }}>
      {children}
    </ReaderContext.Provider>
  );
};
