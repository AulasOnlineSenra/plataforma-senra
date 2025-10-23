import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SenraLogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-40 h-20', className)}>
      <Image
        src="/logo.png"
        alt="Aulas Online Senra Logo"
        fill
        sizes="160px"
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
