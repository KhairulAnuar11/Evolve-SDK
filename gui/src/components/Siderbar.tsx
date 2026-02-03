import { NavLink } from 'react-router-dom';

const menu = [
  { path: '/', label: 'Dashboard' },
  { path: '/readers', label: 'Readers' },
  { path: '/tags', label: 'Tags' },
  { path: '/diagnostics', label: 'Diagnostics' },
  { path: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: '#1e1e1e',
        color: '#fff',
        padding: '20px'
      }}
    >
      <h2 style={{ marginBottom: 30 }}>Evolve RFID</h2>

      {menu.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: 'block',
            padding: '10px',
            marginBottom: '6px',
            color: isActive ? '#4fc3f7' : '#fff',
            textDecoration: 'none',
            borderRadius: 4,
            background: isActive ? '#2a2a2a' : 'transparent'
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
