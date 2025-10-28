
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { classPackages } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Landmark } from 'lucide-react';

function PaymentPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

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

  const handlePayment = (method: 'PayPal' | 'MercadoPago') => {
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
    <div className="flex flex-1 flex-col items-center gap-4 md:gap-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">
          Finalizar Pagamento
        </h1>
        <p className="max-w-2xl text-muted-foreground mt-2">
          Você está a um passo de começar suas aulas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full mt-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 grid gap-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-bold text-lg">{selectedPackage.name}</p>
                <p className="text-sm text-muted-foreground">
                    {selectedPackage.numClasses} {selectedPackage.numClasses > 1 ? 'aulas' : 'aula'}
                </p>
              </div>
              <p className="font-bold text-lg">
                R$ {total.toFixed(2).replace('.',',')}
              </p>
            </div>
            <div className="flex justify-between items-center text-lg font-bold p-4 border-t">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace('.',',')}</span>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            <span>Compra segura e garantida.</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escolha o Método de Pagamento</CardTitle>
            <CardDescription>
              Selecione sua forma de pagamento preferida.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="h-20 justify-start p-4 text-left"
              onClick={() => handlePayment('MercadoPago')}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 flex items-center justify-center rounded-md bg-white p-1">
                  <Image
                    src="https://logopng.com.br/logos/mercado-pago-106.svg"
                    alt="Mercado Pago"
                    width={100}
                    height={25}
                  />
                </div>
                <div>
                  <p className="font-semibold">Mercado Pago</p>
                  <p className="text-xs text-muted-foreground">
                    Cartão de crédito, débito ou saldo em conta.
                  </p>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 justify-start p-4 text-left"
              onClick={() => handlePayment('PayPal')}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 flex items-center justify-center rounded-md bg-white p-1">
                   <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                    alt="PayPal"
                    width={80}
                    height={20}
                  />
                </div>
                <div>
                  <p className="font-semibold">PayPal</p>
                  <p className="text-xs text-muted-foreground">
                    Use seu saldo ou cartões salvos no PayPal.
                  </p>
                </div>
              </div>
            </Button>
            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">outras opções</span>
                </div>
            </div>
            <Button variant="secondary" className="h-14">
                <CreditCard className="mr-3" />
                Cartão de Crédito/Débito
            </Button>
             <Button variant="secondary" className="h-14">
                <Landmark className="mr-3" />
                Pix
            </Button>
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
