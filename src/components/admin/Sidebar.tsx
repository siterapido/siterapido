import { Link, useLocation } from 'react-router-dom';

const menu = [
  { label: 'Leads', path: '/admin/leads' },
  // Futuras páginas podem ser adicionadas aqui
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4">
      <div className="text-2xl font-bold mb-8">Admin</div>
      <nav className="flex-1">
        {menu.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded mb-2 hover:bg-gray-700 transition ${location.pathname === item.path ? 'bg-gray-800' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 