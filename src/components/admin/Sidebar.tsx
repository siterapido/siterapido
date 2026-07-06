import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, CreditCard, Users, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const menu = [
  { label: 'Pipeline', path: '/admin/pipeline', icon: LayoutGrid },
  { label: 'Assinaturas', path: '/admin/assinaturas', icon: CreditCard },
  { label: 'Clientes', path: '/admin/clientes', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Site Rápido</p>
        <p className="text-lg font-semibold text-neutral-900">CRM</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {menu.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-white hover:text-neutral-900"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </aside>
  );
}
