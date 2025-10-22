import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  const logo = PlaceHolderImages.find((img) => img.id === 'logo');

  if (!logo) return null;

  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 font-semibold", className)}>
      <Image
        src={logo.imageUrl}
        alt={logo.description}
        width={100}
        height={28}
        className="h-7 w-auto"
        data-ai-hint={logo.imageHint}
        priority
      />
    </Link>
  );
}
