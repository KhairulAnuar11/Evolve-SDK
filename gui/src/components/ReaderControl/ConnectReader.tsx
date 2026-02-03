// src/components/ReaderControl/ConnectReader.tsx
import React, { useState, useContext } from 'react';
import { ReaderContext } from '../../contexts/ReaderContext';
import { UF3SReader } from '@evolve/sdk';

const ConnectReader: React.FC = () => {
  const { addReader } = useContext(ReaderContext);

  const [name, setName] = useState('UF3S Reader');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(5000);
  const [status, setStatus] = useState('');

  const handleConnect = async () => {
    try {
      const reader = new UF3SReader({ name, ip, port });
      await reader.connect(); // SDK connect function
      addReader(reader);
      setStatus(`Connected: ${name} (${ip}:${port})`);
      setIp('');
      setPort(5000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h3>Connect Reader</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reader Name" />
      <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP Address" />
      <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} placeholder="Port" />
      <button onClick={handleConnect}>Connect</button>
      <div style={{ color: 'blue', marginTop: '5px' }}>{status}</div>
    </div>
  );
};

export default ConnectReader;
