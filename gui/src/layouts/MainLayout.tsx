import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
