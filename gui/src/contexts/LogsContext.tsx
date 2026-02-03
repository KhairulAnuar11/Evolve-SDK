// src/contexts/LogsContext.tsx
import { createContext, useState, ReactNode } from 'react';

interface LogsContextType {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const LogsContext = createContext<LogsContextType>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {}
});

export const LogsProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => setLogs((prev) => [...prev, log]);
  const clearLogs = () => setLogs([]);

  return (
    <LogsContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogsContext.Provider>
  );
};
