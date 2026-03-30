
'use client';

import { useTheme } from 'next-themes';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Menu, Sun, Moon } from 'lucide-react';
import { AppSidebar } from './app-sidebar';
import { SenraLogo } from './senra-logo';
import { useEffect, useState } from 'react';

interface HeaderProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

export function Header({ isCollapsed, toggleCollapse, className = "" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 ${className}`}>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0"
        >
          <AppSidebar isMobile={true} />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-between sm:justify-end">
        <div className="sm:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <SenraLogo className="h-10 w-auto" />
          </div>
        </div>
        {mounted && (
          <div className="flex items-center gap-2 mt-[15px]">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Alternar tema escuro"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </header>
  );
}
