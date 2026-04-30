'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-16">
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

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            Em breve...
          </p>
        </div>
      </div>
    </div>
  );
}