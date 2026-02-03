// src/components/ReaderControl/DisconnectReader.tsx
import React, { useContext, useState } from 'react';
import { ReaderContext } from '../../contexts/ReaderContext';
import { UF3SReader } from '@evolve/sdk';

const DisconnectReader: React.FC = () => {
  const { readers, removeReader } = useContext(ReaderContext);
  const [status, setStatus] = useState('');

  const handleDisconnect = async (reader: UF3SReader) => {
    try {
      await reader.disconnect(); // SDK disconnect
      removeReader(reader);
      setStatus(`Disconnected: ${reader.getInfo().name}`);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h3>Disconnect Reader</h3>
      {readers.length === 0 && <p>No readers connected</p>}
      {readers.map((reader, i) => (
        <div key={i}>
          {reader.getInfo().name} ({reader.getInfo().ip}:{reader.getInfo().port}) 
          <button onClick={() => handleDisconnect(reader)} style={{ marginLeft: '5px' }}>
            Disconnect
          </button>
        </div>
      ))}
      {status && <div style={{ color: 'red', marginTop: '5px' }}>{status}</div>}
    </div>
  );
};

export default DisconnectReader;
