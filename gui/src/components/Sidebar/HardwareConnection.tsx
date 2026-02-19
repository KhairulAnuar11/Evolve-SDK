// gui/src/components/Sidebar/HardwareConnection.tsx
import React, { useState } from 'react';
import { sdkService } from '../../services/sdkService';

interface MqttConfig {
  brokerUrl: string;
  topic: string;
  username: string;
  password: string;
}

export default function HardwareConnection() {
  const [mode, setMode] = useState<'serial' | 'tcp' | 'mqtt'>('tcp');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Mqtt Configuration State
  const [mqttConfig, setMqttConfig] = useState<MqttConfig>({
    brokerUrl: 'mqtt://broker.hivemq.com',
    topic: 'rfid/raw',
    username: '',
    password: '',
  });

  // TCP Configuration State
  const [tcpConfig, setTcpConfig] = useState({
    ip: '192.168.1.100',
    port: 8088,
  });

  // Handle MQTT connection
  const handleMqttConnection = async () => {
    try {
      setError('');
      setLoading(true);

      if (connected) {
        // Disconnect
        await sdkService.disconnect();
        setConnected(false);
      } else {
        // Connect
        const rawBroker = mqttConfig.brokerUrl?.trim();
        const topic = mqttConfig.topic?.trim();
        if (!rawBroker || !topic) {
          setError('Broker URL and Topic are required');
          setLoading(false);
          return;
        }

        // Normalize broker URL and validate (prevent numeric-only input like "1883")
        let brokerToUse = rawBroker;
        try {
          const candidate = rawBroker.includes('://') ? rawBroker : `mqtt://${rawBroker}`;
          const parsed = new URL(candidate);
          if (!parsed.hostname || /^\d+$/.test(parsed.hostname)) {
            throw new Error('Invalid broker URL: missing hostname');
          }
          // Recompose with provided protocol if user used a bare host:port
          brokerToUse = candidate;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invalid broker URL format');
          setLoading(false);
          return;
        }

        const options: any = {};
        if (mqttConfig.username) options.username = mqttConfig.username;
        if (mqttConfig.password) options.password = mqttConfig.password;

        // Add connection timeout (40 seconds)
        const connectionPromise = sdkService.connectMqtt(brokerToUse, topic, options);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout - broker not responding')), 40000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        setConnected(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle TCP connection
  const handleTcpConnection = async () => {
    try {
      setError('');
      setLoading(true);

      if (connected) {
        // Disconnect
        await sdkService.disconnect();
        setConnected(false);
      } else {
        // Connect
        // Add connection timeout (40 seconds)
        const connectionPromise = sdkService.connect(tcpConfig.ip, tcpConfig.port);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout - server not responding')), 40000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        setConnected(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle generic connection click
  const handleConnect = async () => {
    if (mode === 'mqtt') {
      await handleMqttConnection();
    } else if (mode === 'tcp') {
      await handleTcpConnection();
    }
  };

  return (
    <div className="mb-4 p-2 border border-gray-300 rounded bg-white shadow-sm">
      <h3 className="text-xs font-bold text-gray-700 mb-2">Connection Configuration</h3>
      
      {/* Connection Type Selection */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="radio" 
            name="connType" 
            checked={mode === 'serial'} 
            onChange={() => setMode('serial')} 
          />
          <span>Serial COM</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="radio" 
            name="connType" 
            checked={mode === 'tcp'} 
            onChange={() => setMode('tcp')} 
          />
          <span>TCP/IP Mode</span>
        </label>

        <label className='flex items-center gap-2 cursor-pointer'>
          <input 
            type="radio" 
            name="connType" 
            checked={mode === 'mqtt'} 
            onChange={() => setMode('mqtt')} 
          />
          <span>MQTT Mode</span>
        </label>
      </div>

      {/* TCP Specific Controls - Simplified */}
      {mode === 'tcp' && (
        <div className="pl-4 mb-3 border-l-2 border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500">IP Address</label>
              <input 
                type="text" 
                value={tcpConfig.ip} 
                onChange={(e) => setTcpConfig({ ...tcpConfig, ip: e.target.value })}
                className="w-full border p-1 text-xs" 
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500">Port</label>
              <input 
                type="number" 
                value={tcpConfig.port} 
                onChange={(e) => setTcpConfig({ ...tcpConfig, port: parseInt(e.target.value) })}
                className="w-full border p-1 text-xs" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Serial Specific Controls */}
      {mode === 'serial' && (
        <div className="pl-4 mb-3 border-l-2 border-gray-200">
           <label className="block text-[10px] text-gray-500">COM Port</label>
           <select className="w-full border p-1 text-xs">
             <option>COM1</option>
             <option>COM3</option>
           </select>
        </div>
      )}

      {/* MQTT Specific Controls */}
        {mode === 'mqtt' && (
          <div className="pl-4 mb-3 border-l-2 border-gray-200 space-y-2">
            
            <div>
              <label className="block text-[10px] text-gray-500">
                Broker URL
              </label>
              <input
                type="text"
                placeholder="mqtt://broker.hivemq.com"
                value={mqttConfig.brokerUrl}
                onChange={(e) => setMqttConfig({ ...mqttConfig, brokerUrl: e.target.value })}
                className="w-full border p-1 text-xs"
              />
              <p className="text-[9px] text-gray-400 mt-1">e.g., mqtt://broker.hivemq.com or mqtts://localhost:8883</p>
              <p className="text-[9px] text-gray-400 mt-1">Do not enter a port number alone (for example "1883"). Use a hostname or full URL like <span className="font-mono">mqtt://broker.example.com:1883</span>.</p>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500">
                Topic
              </label>
              <input
                type="text"
                placeholder="rfid/raw"
                value={mqttConfig.topic}
                onChange={(e) => setMqttConfig({ ...mqttConfig, topic: e.target.value })}
                className="w-full border p-1 text-xs"
              />
              <p className="text-[9px] text-gray-400 mt-1">MQTT topic to subscribe to</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500">
                  Username (Optional)
                </label>
                <input
                  type="text"
                  value={mqttConfig.username}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
                  className="w-full border p-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={mqttConfig.password}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
                  className="w-full border p-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-[10px] text-red-600">{error}</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className="text-[10px] text-gray-600">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Connect Button */}
      <button 
        disabled={loading}
        className={`w-full py-2 px-4 rounded text-white font-bold text-xs transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : connected 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={handleConnect}
      >
        {loading ? 'Processing...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}