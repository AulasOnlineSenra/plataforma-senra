'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const bannerImages = [
  '/images/banners/close-up-crianca-aprendendo-online-AOS.jpg',
  '/images/banners/full-shot-woman-working-with-laptop.jpg',
  '/images/banners/hOMEM-trabalhando-na-cozinha-AOS.jpg',
  '/images/banners/jovem-entusiasta-encontrou-solucao-AOS.jpg',
  '/images/banners/jovem-feminina-posando-AOS.jpg',
  '/images/banners/mulher-com-laptop-fazendo-anotacoes-AOS.jpg',
  '/images/banners/mulher-em-chamada-de-video-AOS.jpg',
  '/images/banners/mulher-em-videochamada-AOS.jpg',
  '/images/banners/mulher-na-mesa-AOS.jpg',
  '/images/banners/mulher-trabalhando-com-laptop-AOS.jpg',
  '/images/banners/sala-de-aula-virtual-AOS.jpg',
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      {bannerImages.map((src, index) => (
        <div
          key={index}
          className="absolute inset-0 w-full h-full transition-opacity duration-1000"
          style={{
            opacity: index === currentIndex ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          <Image
            src={src}
            alt={`Banner ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}