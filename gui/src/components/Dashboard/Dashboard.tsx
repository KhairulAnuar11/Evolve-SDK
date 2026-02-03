import ReaderStatus from './ReaderStatus';
import TagList from './TagList';

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ReaderStatus />
        <TagList />
      </div>
    </>
  );
}
