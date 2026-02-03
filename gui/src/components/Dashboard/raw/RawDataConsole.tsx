import React from 'react';

export interface RawPacket {
  id: number;
  timestamp: string;
  direction: 'RX' | 'TX';
  data: string;
}

interface RawDataConsoleProps {
  logs: RawPacket[];
  scrollRef: React.RefObject<HTMLDivElement>;
}

export default function RawDataConsole({ logs, scrollRef }: RawDataConsoleProps) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1"
    >
      {logs.length === 0 && (
        <div className="text-gray-400 italic text-center mt-10">
          Waiting for data stream...
        </div>
      )}

      {logs.map((log) => (
        <div
          key={log.id}
          className="flex gap-4 border-b border-gray-100 pb-1 hover:bg-gray-50"
        >
          {/* Timestamp */}
          <span className="text-gray-500 w-20 shrink-0">
            {log.timestamp}
          </span>

          {/* Direction */}
          <span
            className={`w-8 font-bold shrink-0 ${
              log.direction === 'TX'
                ? 'text-blue-600'
                : 'text-green-600'
            }`}
          >
            [{log.direction}]
          </span>

          {/* Data */}
          <span className="text-gray-800 break-all">
            {log.data}
          </span>
        </div>
      ))}
    </div>
  );
}
