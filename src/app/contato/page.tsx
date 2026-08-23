import Link from 'next/link';
import { Mail, Phone, Instagram, Globe, Heart } from 'lucide-react';
import prisma from '@/lib/prisma';
import Image from 'next/image';

export default async function ContatoPage() {
  const settings = await prisma.appSetting.findUnique({
    where: { id: 'global' },
  });

  const email = settings?.contactEmail || 'contato@aos.com.br';
  const whatsapp = settings?.whatsapp || '(21) 99453-6877';
  const instagram = settings?.contactInstagram || '@senra.aulasonline';
  const site = settings?.contactSite || 'www.senraaulasonline.com.br';

  return (
    <div 
      className="min-h-screen relative flex items-center bg-slate-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/fundo-contato.png')" }}
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32 flex">
        
        {/* Left Content Container */}
        <div className="w-full md:w-3/5 lg:w-1/2 py-8 md:py-12 flex flex-col justify-center">
          
          {/* Logo Section */}
          <div className="mb-6">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <Image 
                    src="/images/logo_AOS_fundo_preto.png" 
                    alt="Logo Aulas Online Senra" 
                    fill 
                    className="object-contain" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs tracking-[0.2em] font-bold text-slate-800 uppercase">Aulas Online</span>
                  <span className="text-4xl font-extrabold text-slate-900 leading-none tracking-tight">SENRA</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Title Section */}
          <div className="mb-6 font-extrabold uppercase leading-none tracking-tight">
            <h1 className="text-5xl md:text-6xl lg:text-[5rem] text-slate-900 drop-shadow-sm">FALE</h1>
            <h1 className="text-5xl md:text-6xl lg:text-[5rem] text-amber-500 drop-shadow-sm">CONOSCO</h1>
          </div>

          {/* Description */}
          <div className="w-16 h-1 bg-amber-500 mb-5 rounded-full"></div>
          <p className="text-slate-700 text-lg md:text-xl font-medium max-w-md mb-8">
            Entre em contato conosco para dúvidas, sugestões ou parcerias.
          </p>

          {/* Contact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8">
            {/* Email */}
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 text-white p-3 rounded-full shadow-md shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex flex-col border-l-2 border-slate-300 pl-4">
                <span className="font-bold text-slate-900 text-sm">E-MAIL</span>
                <span className="text-slate-700 font-medium">{email}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-4 sm:translate-x-[50px]">
              <div className="bg-amber-500 text-white p-3 rounded-full shadow-md shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex flex-col border-l-2 border-slate-300 pl-4">
                <span className="font-bold text-slate-900 text-sm">WHATSAPP</span>
                <span className="text-slate-700 font-medium">{whatsapp}</span>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 text-white p-3 rounded-full shadow-md shrink-0">
                <Instagram className="w-6 h-6" />
              </div>
              <div className="flex flex-col border-l-2 border-slate-300 pl-4">
                <span className="font-bold text-slate-900 text-sm">INSTAGRAM</span>
                <span className="text-slate-700 font-medium">{instagram}</span>
              </div>
            </div>

            {/* Site */}
            <div className="flex items-center gap-4 sm:translate-x-[50px]">
              <div className="bg-amber-500 text-white p-3 rounded-full shadow-md shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex flex-col border-l-2 border-slate-300 pl-4">
                <span className="font-bold text-slate-900 text-sm">SITE</span>
                <span className="text-slate-700 font-medium">{site}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Footer Bar */}
      <div className="absolute bottom-0 left-0 right-0 pt-4 pb-[9px] px-6 md:px-12 bg-slate-900/5 border-t border-slate-200/50">
        <div className="container mx-auto flex items-center gap-3 translate-x-[25px]">
          <Heart className="w-[17px] h-[17px] text-brand-blue" />
          <span className="text-white font-medium text-[13px] tracking-[0.5px]">Sua opinião é muito <span className="text-brand-blue font-bold">importante</span> para nós!</span>
        </div>
      </div>
    </div>
  );
}