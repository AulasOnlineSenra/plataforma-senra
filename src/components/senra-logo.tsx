'use client';

import Image from 'next/image';
import Link from 'next/link';

export function SenraLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`relative block w-40 h-16 ${className || ''}`}>
      <Image
        src="/logo.png"
        alt="Logo Aulas Senra"
        fill
        className="object-contain"
        priority 
      />
    </Link>
  );
}