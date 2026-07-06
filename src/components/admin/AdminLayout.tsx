import Sidebar from './Sidebar';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white font-sans text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
