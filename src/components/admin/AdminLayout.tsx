import Sidebar from './Sidebar';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-neutral-900">
      <Sidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">{children}</main>
    </div>
  );
}
