
'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useCallback } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;

interface ResizablePanelContextProps {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  toggleCollapse: () => void;
  panelRef: React.RefObject<ImperativePanelHandle> | null;
}

const ResizablePanelContext = createContext<ResizablePanelContextProps | undefined>(undefined);

export const ResizablePanelProvider = ({ children }: { children: ReactNode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = React.useRef<ImperativePanelHandle>(null);


  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    const panel = panelRef.current;
    if (panel) {
        if (panel.isCollapsed()) {
            panel.expand();
            setIsCollapsed(false);
        } else {
            panel.collapse();
            setIsCollapsed(true);
        }
    }
  }, []);

  const value = useMemo(() => ({
    isDragging,
    setIsDragging,
    sidebarWidth,
    setSidebarWidth: (width: number) => {
        setSidebarWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(width, SIDEBAR_MAX_WIDTH)));
    },
    handleMouseDown,
    isCollapsed,
    setIsCollapsed,
    toggleCollapse,
    panelRef
  }), [isDragging, sidebarWidth, handleMouseDown, isCollapsed, toggleCollapse]);

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
