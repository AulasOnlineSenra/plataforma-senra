import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SenraLogo } from './senra-logo';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-2 font-semibold', className)}
    >
      <SenraLogo className="h-10 w-auto" />
    </Link>
  );
}
