
'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useCallback } from 'react';

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;

interface ResizablePanelContextProps {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const ResizablePanelContext = createContext<ResizablePanelContextProps | undefined>(undefined);

export const ResizablePanelProvider = ({ children }: { children: ReactNode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const value = useMemo(() => ({
    isDragging,
    setIsDragging,
    sidebarWidth,
    setSidebarWidth: (width: number) => {
        setSidebarWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(width, SIDEBAR_MAX_WIDTH)));
    },
    handleMouseDown
  }), [isDragging, sidebarWidth, handleMouseDown]);

  return (
    <ResizablePanelContext.Provider value={value}>
      {children}
    </ResizablePanelContext.Provider>
  );
};

export const useResizablePanel = () => {
  const context = useContext(ResizablePanelContext);
  if (!context) {
    throw new Error('useResizablePanel must be used within a ResizablePanelProvider');
  }
  return context;
};
