'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 z-[9999] shadow-2xl animate-in slide-in-from-bottom-10">
      <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-slate-300 text-sm md:text-base text-center sm:text-left leading-relaxed">
          Nós usamos cookies para analisar o tráfego, personalizar anúncios e melhorar sua experiência em nossa plataforma. 
          Ao continuar navegando, você concorda com a nossa{' '}
          <Link href="/politica-de-privacidade" className="text-amber-400 hover:text-amber-300 underline font-medium">
            Política de Privacidade
          </Link>.
        </div>
        <button
          onClick={acceptCookies}
          className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
        >
          Ciente
        </button>
      </div>
    </div>
  );
}
