'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type ModalSettings = {
  enabled: boolean;
  frequency: string;
  maxVisits: number;
  maxDays: number;
  images: string[];
};

export default function ReferralModalClient({ settings }: { settings: ModalSettings | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    if (!settings || !settings.enabled || !settings.images || settings.images.length === 0) return;

    try {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      
      const lastShownDate = localStorage.getItem('referral_modal_last_shown');
      const lastChangeDateStr = localStorage.getItem('referral_modal_last_change_date');
      const storedVisitsStr = localStorage.getItem('referral_modal_visits');
      const storedImage = localStorage.getItem('referral_modal_current_image');

      // Frequência
      if (settings.frequency === 'once_per_day' && lastShownDate === todayString) {
        return; // Já mostrou hoje
      }

      let visits = parseInt(storedVisitsStr || '0', 10);
      visits += 1;
      
      let lastChangeDate = lastChangeDateStr ? new Date(lastChangeDateStr) : now;
      let daysSinceChange = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 3600 * 24));

      let imageToShow = storedImage;

      // Definir primeira imagem
      if (!imageToShow || !settings.images.includes(imageToShow)) {
        // Tenta achar a imagem padrão 'Indique e ganhe.png' ou 'Indique e ganhe1.png', senão pega a primeira
        const defaultImg = settings.images.find(img => img.toLowerCase().includes('indique e ganhe') && !img.toLowerCase().includes('escuro'));
        imageToShow = defaultImg || settings.images[0];
        visits = 1;
        lastChangeDate = now;
      } else if (visits > settings.maxVisits || daysSinceChange > settings.maxDays) {
        // Rotacionar
        const availableImages = settings.images.filter(img => img !== imageToShow);
        if (availableImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableImages.length);
          imageToShow = availableImages[randomIndex];
        }
        visits = 1;
        lastChangeDate = now;
      }

      // Salvar estado
      localStorage.setItem('referral_modal_last_shown', todayString);
      localStorage.setItem('referral_modal_last_change_date', lastChangeDate.toISOString());
      localStorage.setItem('referral_modal_visits', visits.toString());
      localStorage.setItem('referral_modal_current_image', imageToShow);

      setCurrentImage(imageToShow);
      setIsOpen(true);
    } catch (e) {
      console.error('Erro ao processar modal de indicações', e);
    }
  }, [settings]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative animate-in fade-in zoom-in-95 duration-300 w-auto max-w-[90vw] max-h-[85vh] rounded-[15px] shadow-2xl bg-slate-900 border border-slate-800 flex flex-col">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 overflow-hidden rounded-[15px] flex items-center justify-center">
          <img 
            src={`/images/indicacoes/${currentImage}`} 
            alt="Programa de Indicações"
            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-[15px]"
          />
        </div>
      </div>
    </div>
  );
}
