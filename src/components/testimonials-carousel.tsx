'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonialImages = [
  '/depoimento_alunos_aulas_online_senra1.jpeg',
  '/depoimento_alunos_aulas_online_senra2.jpeg',
  '/depoimento_alunos_aulas_online_senra3.jpeg',
  '/depoimento_alunos_aulas_online_senra4.jpeg',
  '/depoimento_alunos_aulas_online_senra5.jpeg',
  '/depoimento_alunos_aulas_online_senra6.jpeg',
  '/depoimento_alunos_aulas_online_senra7.jpeg',
  '/depoimento_alunos_aulas_online_senra8.jpeg',
  '/depoimento_alunos_aulas_online_senra9.jpeg',
  '/depoimento_alunos_aulas_online_senra10.jpeg',
  '/depoimento_alunos_aulas_online_senra11.jpeg',
  '/depoimento_alunos_aulas_online_senra12.jpeg',
  '/depoimento_alunos_aulas_online_senra13.jpeg',
  '/depoimento_alunos_aulas_online_senra14.jpeg',
  '/depoimento_alunos_aulas_online_senra15.jpeg',
  '/depoimento_alunos_aulas_online_senra16.jpeg',
  '/depoimento_alunos_aulas_online_senra17.jpeg',
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonialImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialImages.length) % testimonialImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialImages.length);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8">
      {/* Navigation Buttons - Outside carousel */}
      <button
        onClick={goToPrevious}
        className="absolute left-[10px] -translate-x-[200px] top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full transition-colors z-10"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-[10px] translate-x-[200px] top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full transition-colors z-10"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      <div className="relative overflow-hidden rounded-[15px] aspect-[16/9] bg-white/5">
        {testimonialImages.map((src, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full transition-opacity duration-700"
            style={{
              opacity: index === currentIndex ? 1 : 0,
            }}
          >
            <Image
              src={src}
              alt={`Depoimento ${index + 1}`}
              fill
              className="object-contain"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}