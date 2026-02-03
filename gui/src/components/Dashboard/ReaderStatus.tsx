const mockReaders = [
  { id: 'UF3S-01', connected: true },
  { id: 'UF3S-02', connected: false }
];

export default function ReaderStatus() {
  return (
    <div style={{ border: '1px solid #ddd', padding: 20 }}>
      <h3>Readers</h3>

      {mockReaders.map(reader => (
        <div
          key={reader.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8
          }}
        >
          <span>{reader.id}</span>
          <span style={{ color: reader.connected ? 'green' : 'red' }}>
            {reader.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      ))}
    </div>
  );
}
