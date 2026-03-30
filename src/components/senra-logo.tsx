'use client';

import Image from 'next/image';
import Link from 'next/link';

export function SenraLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`relative block w-[130px] h-[52px] ${className || ''}`}>
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