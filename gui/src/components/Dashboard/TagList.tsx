const mockTags = [
  { id: 'E2000017221101441890A1B', reader: 'UF3S-01', time: '10:21:12' },
  { id: 'E2000017221101441890A1C', reader: 'UF3S-01', time: '10:21:15' }
];

export default function TagList() {
  return (
    <div style={{ border: '1px solid #ddd', padding: 20 }}>
      <h3>Live Tags</h3>

      {mockTags.map(tag => (
        <div key={tag.id} style={{ fontSize: 14, marginBottom: 6 }}>
          <strong>{tag.id}</strong>
          <div style={{ color: '#666' }}>
            {tag.reader} — {tag.time}
          </div>
        </div>
      ))}
    </div>
  );
}
