import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark">
      <Sidebar />
      <TopBar />
      <main className="ml-[220px] mt-14 p-6 min-h-[calc(100vh-56px)]">
        <Outlet />
      </main>
    </div>
  );
};
