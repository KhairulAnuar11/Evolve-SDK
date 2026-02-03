// gui/src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';

interface RawPacket {
  id: number;
  timestamp: string;
  direction: 'RX' | 'TX';
  data: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<RawPacket[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate data (Remove later)
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: RawPacket = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        direction: Math.random() > 0.5 ? 'RX' : 'TX',
        data: 'AA 00 22 00 11 01 02 34 56 78 9A BC DE F0 ' + Math.floor(Math.random() * 99)
      };
      setLogs(prev => [...prev.slice(-100), newLog]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200">
      
      {/* Header - Light Gray */}
      <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b border-gray-200 rounded-t-lg">
        <span className="text-gray-700 font-mono text-sm font-bold">Raw Data Stream</span>
        <button 
          onClick={() => setLogs([])}
          className="text-xs bg-indigo-500 border border-gray-300 hover:bg-indigo-600 text-white px-2 py-1 rounded shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* Console Content - White Background */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1"
      >
        {logs.length === 0 && (
          <div className="text-gray-400 italic text-center mt-10">Waiting for data stream...</div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 border-b border-gray-100 pb-1 hover:bg-gray-50">
            {/* Timestamp */}
            <span className="text-gray-500 w-20 shrink-0">{log.timestamp}</span>
            
            {/* Direction */}
            <span className={`w-8 font-bold shrink-0 ${log.direction === 'TX' ? 'text-blue-600' : 'text-green-600'}`}>
              [{log.direction}]
            </span>
            
            {/* Data Hex String */}
            <span className="text-gray-800 break-all">{log.data}</span>
          </div>
        ))}
      </div>
    </div>
  );
}