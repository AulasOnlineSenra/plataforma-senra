'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function SenraLogo({ className }: { className?: string }) {
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    const updateLogo = () => {
      const storedLogo = localStorage.getItem('appLogo');
      if (storedLogo) {
        setLogoSrc(storedLogo);
      } else {
        setLogoSrc('/logo.png');
      }
    };

    updateLogo();

    window.addEventListener('storage', updateLogo);
    return () => {
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

  return (
    <div className={cn('relative w-40 h-20', className)}>
      <Image
        src={logoSrc}
        alt="Aulas Online Senra Logo"
        fill
        sizes="160px"
        className="object-contain"
        data-ai-hint="logo"
        key={logoSrc}
      />
    </div>
  );
}
