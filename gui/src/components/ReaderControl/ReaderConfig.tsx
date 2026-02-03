// src/components/ReaderControl/ReaderConfig.tsx
import React, { useState, useContext } from 'react';
import { ReaderContext } from '../../contexts/ReaderContext';
import { UF3SReader } from '@evolve/sdk';

const ReaderConfig: React.FC = () => {
  const { readers } = useContext(ReaderContext);
  const [selectedReaderIndex, setSelectedReaderIndex] = useState(0);
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(5000);

  const reader = readers[selectedReaderIndex];

  const handleUpdate = () => {
    if (!reader) return;
    reader.updateConfig({ name, ip, port }); // SDK method to update config
    // Refresh local state
    setName('');
    setIp('');
    setPort(5000);
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h3>Reader Configuration</h3>
      {readers.length === 0 && <p>No readers connected</p>}
      {readers.length > 0 && (
        <>
          <select onChange={(e) => setSelectedReaderIndex(Number(e.target.value))}>
            {readers.map((r, i) => (
              <option key={i} value={i}>
                {r.getInfo().name} ({r.getInfo().ip}:{r.getInfo().port})
              </option>
            ))}
          </select>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="IP" value={ip} onChange={(e) => setIp(e.target.value)} />
          <input type="number" placeholder="Port" value={port} onChange={(e) => setPort(Number(e.target.value))} />
          <button onClick={handleUpdate}>Update</button>
        </>
      )}
    </div>
  );
};

export default ReaderConfig;
