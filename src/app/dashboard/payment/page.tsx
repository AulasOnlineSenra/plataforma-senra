
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { classPackages as defaultClassPackages } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Landmark, ShoppingCart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ClassPackage } from '@/lib/types';
import { useState, useEffect } from 'react';

const PACKAGES_STORAGE_KEY = 'classPackages';


function PaymentPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [classPackages, setClassPackages] = useState<ClassPackage[]>(defaultClassPackages);

  useEffect(() => {
    const storedPackages = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (storedPackages) {
      setClassPackages(JSON.parse(storedPackages));
    }
  }, []);

  const packageId = searchParams.get('packageId');
  
  // For custom packages
  const customName = searchParams.get('name');
  const customTotalClasses = searchParams.get('totalClasses');
  const customPricePerClass = searchParams.get('pricePerClass');
  const customTotal = searchParams.get('total');

  let selectedPackage;

  if (packageId) {
    selectedPackage = classPackages.find(p => p.id === packageId);
  } else if (customName && customTotalClasses && customPricePerClass && customTotal) {
    selectedPackage = {
      id: 'custom',
      name: customName,
      numClasses: parseInt(customTotalClasses),
      pricePerClass: parseFloat(customPricePerClass),
      durationMinutes: 90, // Assuming default
      popular: false,
      total: parseFloat(customTotal)
    };
  }

  if (!selectedPackage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 md:gap-8 text-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Pacote não encontrado
        </h1>
        <p className="text-muted-foreground">
          Não foi possível encontrar os detalhes do pacote selecionado.
        </p>
        <Button asChild>
          <a href="/dashboard/packages">Voltar para Pacotes</a>
        </Button>
      </div>
    );
  }
  
  const total = selectedPackage.total || (selectedPackage.numClasses * selectedPackage.pricePerClass);

  const handlePayment = (method: string) => {
    toast({
        title: "Processando Pagamento...",
        description: `Seu pagamento de R$ ${total.toFixed(2).replace('.',',')} com ${method} está sendo processado.`,
    });
    // In a real app, you would redirect to the payment gateway
    setTimeout(() => {
         toast({
            title: "Pagamento Aprovado!",
            description: "Seus créditos de aula foram adicionados à sua conta.",
        });
    }, 3000);
  }


  return (
    <div className="flex flex-1 flex-col items-center gap-4 md:gap-8">
      <div className="text-center w-full max-w-4xl">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">
          Finalizar Pagamento
        </h1>
        <p className="max-w-2xl text-muted-foreground mt-2 mx-auto">
          Você está a um passo de começar suas aulas.
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/50 rounded-t-lg border-b">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Resumo do Pedido</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid gap-6">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                   <h3 className="font-semibold text-lg">{selectedPackage.name}</h3>
                   <div className="flex items-center text-sm text-muted-foreground">
                       <Check className="h-4 w-4 mr-2 text-green-500" />
                       <span>{selectedPackage.numClasses} {selectedPackage.numClasses > 1 ? 'aulas' : 'aula'} de {selectedPackage.durationMinutes} min</span>
                   </div>
                   <div className="flex items-center text-sm text-muted-foreground">
                       <Check className="h-4 w-4 mr-2 text-green-500" />
                       <span>Acesso a professores especialistas</span>
                   </div>
                   <div className="flex items-center text-sm text-muted-foreground">
                       <Check className="h-4 w-4 mr-2 text-green-500" />
                       <span>Flexibilidade de horários</span>
                   </div>
                </div>
                 <div className="flex flex-col items-start md:items-end justify-center bg-accent/20 p-6 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor por aula</p>
                    <p className="text-lg font-medium">R$ {selectedPackage.pricePerClass.toFixed(2).replace('.', ',')}</p>
                    <Separator className="my-3"/>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">R$ {total.toFixed(2).replace('.', ',')}</p>
                 </div>
            </div>
            
            <Separator />

            <div>
                <h3 className="font-semibold text-lg mb-4">Escolha o Método de Pagamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Button
                        variant="outline"
                        className="h-24 flex-col gap-2"
                        onClick={() => handlePayment('MercadoPago')}
                    >
                        <Image
                            src="https://logopng.com.br/logos/mercado-pago-106.svg"
                            alt="Mercado Pago"
                            width={100}
                            height={25}
                        />
                        <span className="text-xs text-muted-foreground">Cartão, Saldo ou Pix</span>
                    </Button>
                     <Button
                        variant="outline"
                        className="h-24 flex-col gap-2"
                        onClick={() => handlePayment('PayPal')}
                    >
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                            alt="PayPal"
                            width={80}
                            height={20}
                        />
                         <span className="text-xs text-muted-foreground">Saldo ou Cartão</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handlePayment('Cartão')}>
                        <CreditCard className="h-6 w-6" />
                        <span>Cartão de Crédito/Débito</span>
                    </Button>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handlePayment('Pix')}>
                        <Landmark className="h-6 w-6" />
                        <span>Pix</span>
                    </Button>
                </div>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-4">
                <Check className="h-3 w-3 inline-block mr-1 text-green-500" />
                Pagamento seguro e processado por nossos parceiros.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PaymentPageComponent />
        </Suspense>
    )
}
