import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  setCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fynd_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fynd_sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const setCollapsed = (val: boolean) => setIsCollapsed(val);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
