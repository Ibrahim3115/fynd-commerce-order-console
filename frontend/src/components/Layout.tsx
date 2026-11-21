import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

const LayoutContent: React.FC = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'ml-[72px]' : 'ml-[240px]'
        }`}
      >
        <TopBar />
        <main className="mt-16 p-6 min-h-[calc(100vh-64px)] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};
