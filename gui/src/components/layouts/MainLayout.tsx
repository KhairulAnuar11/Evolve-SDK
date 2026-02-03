// gui/src/components/layouts/MainLayout.tsx
import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header'; // Optional, or remove if you want exactly like screenshot
//import { useLogs } from '../../contexts/LogsContext'; // You'll need to create this later

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans text-sm">
      {/* 1. Left Sidebar (Fixed width) */}
      <aside className="w-72 flex-shrink-0 bg-gray-50 border-r border-gray-300 flex flex-col">
        <Sidebar />
      </aside>

      {/* 2. Right Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top: Header (Optional menus like File, Edit...) */}
        {/* <Header /> */}

        {/* Middle: Main Content (Raw Data View) */}
        <div className="flex-1 relative overflow-hidden p-4">
          {children}
        </div>

        {/* Bottom: System Logs */}
        <div className="h-48 border-t border-gray-300 bg-gray-50 flex flex-col">
          <div className="bg-gray-200 px-2 py-1 text-xs font-bold text-gray-600 border-b border-gray-300">
            Error Log / System Messages
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-white">
            {/* We will inject logs here later */}
            <div className="text-green-600">[INFO] System Ready.</div>
            <div className="text-red-600">[ERROR] Connection failed.</div>
          </div>
          
          {/* Footer Status Bar */}
          <div className="bg-purple-600 text-white px-2 py-1 text-xs flex justify-between items-center">
            <span>Connected to TCP/IP 192.168.1.100:8088</span>
            <span>v1.0.3</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;