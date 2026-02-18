import { cn } from '@/lib/utils';
import { SenraLogo } from './senra-logo';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold', className)}>
      <SenraLogo className="h-20 w-auto" />
    </div>
  );
}
