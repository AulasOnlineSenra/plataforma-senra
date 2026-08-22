'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ContatoPage() {
  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/fundo-contato.png')" }}
    >
      <div className="bg-slate-900/90 backdrop-blur-sm text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            href="/home" 
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
            Contato
          </h1>
          <p className="text-slate-300 text-lg">
            Entre em contato conosco
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12 flex-1">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-8 md:p-12 text-center mt-10">
          <h2 className="text-3xl font-headline font-bold text-slate-800 mb-4">Em breve...</h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Nossa página de contato está sendo reformulada para melhor atendê-lo.
          </p>
        </div>
      </div>
    </div>
  );
}