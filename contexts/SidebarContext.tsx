"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const handleSetIsCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("admin-sidebar-collapsed", String(value));
  };

  const toggleCollapsed = () => {
    handleSetIsCollapsed(!isCollapsed);
  };

  // Return default collapsed state during SSR to avoid hydration mismatch
  const contextValue: SidebarContextType = {
    isCollapsed: isMounted ? isCollapsed : false,
    setIsCollapsed: handleSetIsCollapsed,
    toggleCollapsed,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
