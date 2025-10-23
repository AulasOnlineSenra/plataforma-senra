import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const isChatPage = false; // This will be dynamic in a real app

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar md:block">
        <AppSidebar />
      </div>
      <div className="flex flex-col">
        <Header />
        <main className={cn(
          "flex flex-1 flex-col",
          !isChatPage && "gap-4 p-4 lg:gap-6 lg:p-6 bg-background"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
