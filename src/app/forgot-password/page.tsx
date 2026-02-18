'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { SenraLogo } from '@/components/senra-logo';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Chama a nossa action do banco de dados/mailer
    await requestPasswordReset(email);
    
    // Mostramos sucesso independente de o e-mail existir
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Link href="/login"><SenraLogo /></Link>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
          
          <div className="flex items-center justify-start mb-6">
             <Button asChild variant="ghost" className="-ml-4 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-full px-4">
               <Link href="/login"><ArrowLeft className="h-5 w-5 mr-2" /> Voltar</Link>
             </Button>
          </div>

          {!isSuccess ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-2xl font-bold font-headline mb-2 text-slate-900">Recuperar Senha</h1>
              <p className="text-slate-500 text-sm mb-8">Digite o e-mail associado à sua conta e enviaremos um link para criar uma nova senha.</p>

              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2 relative">
                  <Label htmlFor="email" className="font-bold text-slate-700">Seu E-mail</Label>
                  <Mail className="absolute left-3 top-[38px] h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" placeholder="aluno@email.com" required className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-brand-yellow hover:bg-amber-400 text-slate-900 font-bold shadow-md text-lg transition-all mt-2">
                  {isSubmitting ? 'A enviar...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center animate-in zoom-in-95 duration-500 py-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold font-headline mb-2 text-slate-900">E-mail Enviado!</h1>
                <p className="text-slate-500 text-sm mb-8">
                    Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link de recuperação em instantes. Verifique também a sua caixa de spam.
                </p>
                <Button asChild className="h-12 w-full rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800">
                    <Link href="/login">Voltar para o Login</Link>
                </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}