import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarAberto, setSidebarAberto] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar aberto={sidebarAberto} onFechar={() => setSidebarAberto(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarAberto(!sidebarAberto)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
