'use client';

import { useEffect, useState } from 'react';

const FUNDOS = [
  '/fundos-blog/aerial-shot-beautiful-copacabana-beach-rio-de-janeiro-brazil-sunset-sky.jpg',
  '/fundos-blog/beautiful-waterfall-streaming-into-river-surrounded-by-greens.jpg',
  '/fundos-blog/imagem-fundo-blog.png',
  '/fundos-blog/Lagoa Rodrigo de Freitas ao entardecer.png',
  '/fundos-blog/sugarloaf-mountain-cable-car-sunset.jpg',
  '/fundos-blog/vertical-shot-beautiful-trees-mountains-captured-queensland-australia.jpg',
];

const VISITAS_PARA_TROCA = 15;
const STORAGE_KEY_VISITS = 'blogVisits';
const STORAGE_KEY_BACKGROUND = 'blogCurrentBackground';

export default function BlogBackground() {
  const [background, setBackground] = useState<string>('');

  useEffect(() => {
    const visits = parseInt(localStorage.getItem(STORAGE_KEY_VISITS) || '0', 10);
    const currentBg = localStorage.getItem(STORAGE_KEY_BACKGROUND);

    let newBackground: string;

    if (visits === 0 || visits % VISITAS_PARA_TROCA === 0) {
      const availableFundos = currentBg 
        ? FUNDOS.filter(f => f !== currentBg) 
        : FUNDOS;
      const randomIndex = Math.floor(Math.random() * availableFundos.length);
      newBackground = availableFundos[randomIndex];
      localStorage.setItem(STORAGE_KEY_BACKGROUND, newBackground);
    } else {
      newBackground = currentBg || FUNDOS[0];
    }

    const newVisits = visits + 1;
    localStorage.setItem(STORAGE_KEY_VISITS, newVisits.toString());
    setBackground(newBackground);
  }, []);

  if (!background) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10"
      style={{ backgroundImage: `url(${background})` }}
    />
  );
}