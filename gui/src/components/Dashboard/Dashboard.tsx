import React, { useState, useEffect, useRef } from 'react';
import RawDataConsole, { RawPacket } from '../Dashboard/raw/RawDataConsole';

export default function Dashboard() {
  const [logs, setLogs] = useState<RawPacket[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulated data (remove later)
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: RawPacket = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        direction: Math.random() > 0.5 ? 'RX' : 'TX',
        data:
          'AA 00 22 00 11 01 02 34 56 78 9A BC DE F0 ' +
          Math.floor(Math.random() * 99),
      };

      setLogs((prev) => [...prev.slice(-100), newLog]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200">
      
      {/* Header */}
      <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b border-gray-200 rounded-t-lg">
        <span className="text-gray-700 font-mono text-sm font-bold">
          Raw Data Stream
        </span>

        <button
          onClick={() => setLogs([])}
          className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* Raw Data Console */}
      <RawDataConsole logs={logs} scrollRef={scrollRef} />
    </div>
  );
}
