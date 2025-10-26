
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AppSidebar } from './app-sidebar';
import { SenraLogo } from './senra-logo';
import { useResizablePanel } from './resizable-panel-provider';

export function Header() {
  const { toggleCollapse, isCollapsed } = useResizablePanel();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Button size="icon" variant="outline" className="hidden md:flex" onClick={toggleCollapse}>
        {isCollapsed ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0">
          <AppSidebar isMobile={true} />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-between sm:justify-end">
        <div className="sm:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <SenraLogo className="h-10 w-auto" />
            </Link>
        </div>
      </div>
    </header>
  );
}
