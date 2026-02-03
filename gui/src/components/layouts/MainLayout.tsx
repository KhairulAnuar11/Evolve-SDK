// gui/src/components/layouts/MainLayout.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import SettingsModal from '../Settings/SettingsModal';
import { useLogs } from '../../contexts/LogsContext'; // Import Context

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { logs, addLog } = useLogs(); // Get logs from context

  // Handle "File > History" Export
  useEffect(() => {
    // @ts-ignore
    const removeListener = window.electronAPI.onExportLogsTrigger(async () => {
      if (logs.length === 0) {
        alert("No logs to export.");
        return;
      }

      // 1. Format logs into a string
      const logContent = logs.map(l => 
        `[${l.timestamp}] [${l.type}] ${l.message}`
      ).join('\n');

      // 2. Send to Electron to save
      // @ts-ignore
      const result = await window.electronAPI.saveLogs(logContent);
      
      if (result.success) {
        addLog("Logs exported successfully to file.", "SUCCESS");
      } else if (result.error) {
        addLog("Failed to export logs.", "ERROR");
      }
    });

    // Handle Settings Menu
    // @ts-ignore
    const settingsListener = window.electronAPI.onOpenSettings(() => setIsSettingsOpen(true));

    // Cleanup isn't strictly necessary in simple Electron apps but good practice
  }, [logs, addLog]);

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans text-sm">
      {/* Native - Style header for Electron */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* 1. Left Sidebar (Fixed width) */}
        <aside className="w-72 flex-shrink-0 bg-gray-50 border-r border-gray-300 flex flex-col">
          <Sidebar />
        </aside>

        {/* 2. Right Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Top: Header (Optional menus like File, Edit...) */}
          {/* <Header /> */}

          {/* Middle: Main Content (Raw Data View) */}
          <div className="flex-1 relative overflow-hidden p-4 bg-gray-100">
            {children}
          </div>

          {/* --- BOTTOM LOGS PANEL --- */}
          <div className="h-48 border-t border-gray-300 bg-gray-50 flex flex-col">
            <div className="bg-gray-200 px-2 py-1 text-xs font-bold text-gray-600 border-b border-gray-300 flex justify-between">
              <span>Error Log / System Messages</span>
              <span className="text-[10px] text-gray-500">{logs.length} messages</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-white">
              {/* We will inject logs here later */}
              {/* Conditional rendering of context logs or fallback dummy logs */}
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-400 mr-2">[{log.timestamp}]</span>
                    <span className={`font-bold mr-2 
                      ${log.type === 'ERROR' ? 'text-red-600' : 
                        log.type === 'SUCCESS' ? 'text-green-600' : 
                        log.type === 'WARNING' ? 'text-orange-500' : 'text-blue-600'}`}>
                      [{log.type}]
                    </span>
                    <span className="text-gray-700">{log.message}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="text-green-600">[INFO] System Ready.</div>
                  <div className="text-red-600">[ERROR] Connection failed.</div>
                </>
              )}
              {/* Dummy Anchor to auto-scroll could go here */}
            </div>

            {/* Footer Status Bar */}
            <div className="bg-indigo-500 text-white px-2 py-1 text-xs flex justify-between items-center">
              <span>Connected to TCP/IP 192.168.1.100:8088</span>
              <span>v1.0.0</span>
            </div>
            
            {/* Settings Modal */}
            <SettingsModal 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)} 
            />
          </div>
          {/* ------------------------- */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;