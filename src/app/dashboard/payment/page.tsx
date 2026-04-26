

'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { classPackages as defaultClassPackages, users as initialUsers, getMockUser, paymentHistory as initialPaymentHistory, logNotification, scheduleEvents as initialSchedule, teachers as initialTeachers, logActivity, subjects as initialSubjects } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Landmark, ShoppingCart, Copy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ClassPackage, User, PaymentTransaction, ScheduleEvent, Subject } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const PACKAGES_STORAGE_KEY = 'classPackages';
const PIX_KEY_STORAGE_KEY = 'pixPaymentKey';
const DEFAULT_PIX_KEY = '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540550.005802BR5913NOME_COMPLETO6009SAO_PAULO62070503***6304E2B1';
const USERS_STORAGE_KEY = 'userList';
const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';
const PENDING_BOOKINGS_STORAGE_KEY = 'pendingBookings';


function PaymentPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [classPackages, setClassPackages] = useState<ClassPackage[]>(defaultClassPackages);
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
  const [pixKey, setPixKey] = useState(DEFAULT_PIX_KEY);
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  useEffect(() => {
    const storedPackages = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (storedPackages) {
      setClassPackages(JSON.parse(storedPackages));
    }
    const storedPixKey = localStorage.getItem(PIX_KEY_STORAGE_KEY);
    if (storedPixKey) {
      setPixKey(storedPixKey);
    }
    const storedUser = localStorage.getItem('currentUser');
    setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser('student'));
  }, []);

  const packageId = searchParams?.get('packageId');
  
  // For custom packages
  const customName = searchParams?.get('name');
  const customTotalClasses = searchParams?.get('totalClasses');
  const customPricePerClass = searchParams?.get('pricePerClass');
  const customTotal = searchParams?.get('total');

  let selectedPackage: (ClassPackage & { total?: number }) | undefined;


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

  const confirmPendingBookings = useCallback(async () => {
    const pendingBookingsRaw = localStorage.getItem(PENDING_BOOKINGS_STORAGE_KEY);
    if (!pendingBookingsRaw) return;

    const pendingBookings = JSON.parse(pendingBookingsRaw);
    if (!Array.isArray(pendingBookings) || pendingBookings.length === 0) return;
    
    // This logic is duplicated from booking page, consider refactoring to a shared service in a real app
    const storedSchedule = localStorage.getItem('scheduleEvents');
    const scheduleEvents: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule) : initialSchedule;
    
    const storedUsers = localStorage.getItem('userList');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
    
    const storedTeachers = localStorage.getItem('teacherList');
    const teachers: User[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
    
    const storedSubjects = localStorage.getItem('subjects');
    const subjects: Subject[] = storedSubjects ? JSON.parse(storedSubjects) : initialSubjects;


    const newScheduleEvents = pendingBookings.map((b: any) => ({
      id: b.id,
      title: `Aula de ${subjects.find((s: any) => s.id === b.subjectId)?.name || 'Desconhecida'}`,
      start: new Date(b.start),
      end: new Date(b.end),
      studentId: b.studentId,
      teacherId: b.teacherId,
      subject: subjects.find((s: any) => s.id === b.subjectId)?.name || 'Desconhecida',
      status: 'scheduled' as 'scheduled',
      isExperimental: b.isExperimental,
    }));
    
    const updatedSchedule = [...scheduleEvents, ...newScheduleEvents];
    localStorage.setItem('scheduleEvents', JSON.stringify(updatedSchedule));
    
    // Decrement credits for the new bookings
    const student = users.find(u => u.id === pendingBookings[0].studentId);
    if (student) {
        const nonExperimentalBookings = pendingBookings.filter((b:any) => !b.isExperimental);
        const updatedUsers = users.map(u => u.id === student.id ? { ...u, classCredits: (u.classCredits || 0) - nonExperimentalBookings.length } : u);
        localStorage.setItem('userList', JSON.stringify(updatedUsers));
        localStorage.setItem('currentUser', JSON.stringify(updatedUsers.find(u => u.id === student.id)));
    }

    newScheduleEvents.forEach((event: ScheduleEvent) => {
        const teacher = teachers.find(t => t.id === event.teacherId);
        const student = users.find(u => u.id === event.studentId);
        
        const description = `${student?.name} agendou uma nova aula de ${event.subject} com o professor(a) ${teacher?.name}.`;
        
        logNotification({
            type: 'class_scheduled',
            title: 'Nova Aula Agendada',
            description: description,
            userId: student?.id,
        });

        logActivity(`Agendou uma aula de ${event.subject} com ${teacher?.name}`);
    });

    localStorage.removeItem(PENDING_BOOKINGS_STORAGE_KEY);

    toast({
      title: 'Agendamentos Pendentes Confirmados!',
      description: `${pendingBookings.length} aulas foram agendadas com sucesso.`,
    });

  }, [toast]);


  if (!selectedPackage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 md:gap-8 text-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Pacote não encontrado
        </h1>
        <p className="text-muted-foreground">
          Não foi possível encontrar os detalhes do pacote selecionado.
        </p>
        <Button onClick={() => router.push('/dashboard/packages')}>Voltar para Pacotes</Button>
      </div>
    );
  }
  
  const total = selectedPackage.total || (selectedPackage.numClasses * selectedPackage.pricePerClass);

  const handlePayment = (method: string) => {
    if (!currentUser || !selectedPackage) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Usuário ou pacote não encontrado. Faça login novamente.",
        });
        return;
    }
    
    toast({
        title: "Processando Pagamento...",
        description: `Seu pagamento de R$ ${total.toFixed(2).replace('.',',')} com ${method} está sendo processado.`,
    });

    setTimeout(() => {
        // Update user credits
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const users: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            const updatedUser = { ...users[userIndex] };
            updatedUser.classCredits = (updatedUser.classCredits || 0) + selectedPackage.numClasses;
            updatedUser.activePackage = selectedPackage.name;
            
            users[userIndex] = updatedUser;
            
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }

        // Add to payment history
        const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
        const history: PaymentTransaction[] = storedHistory ? JSON.parse(storedHistory).map((p: any) => ({...p, date: new Date(p.date)})) : initialPaymentHistory;
        
        const newTransaction: PaymentTransaction = {
            id: `pay-${Date.now()}`,
            studentId: currentUser.id,
            packageName: selectedPackage.name,
            creditsAdded: selectedPackage.numClasses,
            amount: total,
            date: new Date(),
            paymentMethod: method,
        };
        
        const updatedHistory = [...history, newTransaction];
        localStorage.setItem(PAYMENT_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        
        logNotification({
            type: 'package_purchased',
            title: 'Compra de Pacote Realizada',
            description: `${currentUser.name} comprou o "${selectedPackage.name}" por R$ ${total.toFixed(2).replace('.', ',')}.`,
            userId: currentUser.id,
        });
        
        // Notify other components of the changes
        window.dispatchEvent(new Event('storage'));

        toast({
            title: "Pagamento Aprovado!",
            description: "Seus créditos de aula foram adicionados à sua conta.",
        });
        
        confirmPendingBookings();

        router.push('/dashboard');
    }, 3000);
  }
  
  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: 'Chave Pix Copiada!',
      description: 'A chave foi copiada para a área de transferência.',
    });
  };


  return (
    <>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handlePayment('Cartão de Crédito')}>
                        <CreditCard className="h-6 w-6" />
                        <span>Cartão de Crédito/Débito</span>
                    </Button>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setIsPixDialogOpen(true)}>
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
     <Dialog open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento com Pix</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu aplicativo de banco ou copie a chave para
              pagar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg border">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`}
                alt="QR Code para pagamento Pix"
                width={200}
                height={200}
              />
            </div>
            <div className="w-full grid gap-2">
              <Label htmlFor="pix-key">Chave Pix (Copia e Cola)</Label>
              <div className="relative">
                <Input
                  id="pix-key"
                  readOnly
                  value={pixKey}
                  className="pr-12 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleCopyPixKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => handlePayment('Pix')}>
                Já Paguei
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PaymentPageComponent />
        </Suspense>
    )
}
