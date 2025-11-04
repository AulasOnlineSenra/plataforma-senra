
'use client';

import { useState, useEffect } from 'react';
import { AppLogoUploader } from '@/components/app-logo-uploader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, KeyRound, Edit, UserCircle, Trash2, DollarSign } from 'lucide-react';
import { users as initialUsers, scheduleEvents as initialSchedule } from '@/lib/data';
import { User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const INACTIVITY_STORAGE_KEY = 'studentInactivityDays';
const PIX_KEY_STORAGE_KEY = 'pixPaymentKey';
const USERS_STORAGE_KEY = 'userList';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';


export default function AdminSettingsPage() {
  const [inactivityDays, setInactivityDays] = useState(90);
  const [pixKey, setPixKey] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialSchedule);
  const [adminToDelete, setAdminToDelete] = useState<User | null>(null);
  const [teacherPaymentRate, setTeacherPaymentRate] = useState(50);
  const [paymentDay, setPaymentDay] = useState('friday');
  const [paymentFrequency, setPaymentFrequency] = useState('weekly');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const updateData = () => {
        const storedDays = localStorage.getItem(INACTIVITY_STORAGE_KEY);
        if (storedDays) {
        setInactivityDays(parseInt(storedDays, 10));
        }
        const storedPixKey = localStorage.getItem(PIX_KEY_STORAGE_KEY);
        if (storedPixKey) {
        setPixKey(storedPixKey);
        }
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers));
        }
        const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (storedSchedule) {
        setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start), end: new Date(e.end)})));
        }
        const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
        if (storedRate) {
            setTeacherPaymentRate(parseFloat(storedRate));
        }
        const storedPaymentDay = localStorage.getItem(TEACHER_PAYMENT_DAY_KEY);
        if (storedPaymentDay) {
            setPaymentDay(storedPaymentDay);
        }
        const storedPaymentFrequency = localStorage.getItem(TEACHER_PAYMENT_FREQUENCY_KEY);
        if (storedPaymentFrequency) {
            setPaymentFrequency(storedPaymentFrequency);
        }
    }
    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);
  
  const admins = allUsers.filter(u => u.role === 'admin');

  const handleSaveInactivity = () => {
    localStorage.setItem(INACTIVITY_STORAGE_KEY, String(inactivityDays));
    toast({
      title: 'Configuração Salva!',
      description: 'O período de inatividade foi atualizado.',
    });
  };

  const handleSavePixKey = () => {
    localStorage.setItem(PIX_KEY_STORAGE_KEY, pixKey);
    toast({
      title: 'Chave Pix Salva!',
      description: 'A nova chave Pix foi configurada para os pagamentos.',
    });
  };

  const handleDeleteRequest = (admin: User) => {
    setAdminToDelete(admin);
  };

  const handleDeleteAdmin = () => {
    if (!adminToDelete) return;

    // Cancel all future classes associated with this admin if they also act as a teacher/student
    const updatedSchedule = scheduleEvents.map(event => {
      if ((event.studentId === adminToDelete.id || event.teacherId === adminToDelete.id) && event.status === 'scheduled') {
        return { ...event, status: 'cancelled' as const };
      }
      return event;
    });
    setScheduleEvents(updatedSchedule);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));


    const updatedUsers = allUsers.filter((user) => user.id !== adminToDelete.id);
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Administrador Excluído',
      description: `O perfil de ${adminToDelete.name} foi removido e suas aulas futuras foram canceladas.`,
    });
    setAdminToDelete(null);
  };
  
  const handleSaveTeacherPaymentSettings = () => {
    localStorage.setItem(TEACHER_PAYMENT_RATE_KEY, String(teacherPaymentRate));
    localStorage.setItem(TEACHER_PAYMENT_DAY_KEY, paymentDay);
    localStorage.setItem(TEACHER_PAYMENT_FREQUENCY_KEY, paymentFrequency);
    toast({
      title: 'Configurações Salvas!',
      description: 'As configurações de pagamento dos professores foram atualizadas.',
    });
  };


  return (
    <>
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Configurações do Administrador
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Logo do Aplicativo</CardTitle>
          <CardDescription>
            Faça o upload de uma nova imagem para ser o logo do aplicativo.
            Formatos aceitos: PNG, JPG, SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppLogoUploader />
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle />
            Gerenciar Administradores
          </CardTitle>
          <CardDescription>
            Visualize e gerencie os perfis de administradores da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={admin.avatarUrl} alt={admin.name} />
                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/profile?userId=${admin.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar Perfil</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRequest(admin)}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir Administrador</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Alunos</CardTitle>
          <CardDescription>
            Defina regras para a gestão de alunos na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2 max-w-sm">
                <Label htmlFor="inactivity-days">Período de Inatividade (dias)</Label>
                <Input
                    id="inactivity-days"
                    type="number"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(parseInt(e.target.value, 10) || 0)}
                    min="1"
                    placeholder='Ex: 90'
                />
                <p className="text-sm text-muted-foreground">
                    Um aluno será classificado como inativo após este período sem contratar novas aulas.
                </p>
            </div>
             <div className="flex">
                <Button onClick={handleSaveInactivity}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configuração de Inatividade
                </Button>
            </div>
        </CardContent>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>Pagamentos aos Professores</CardTitle>
              <CardDescription>
                  Defina o valor e a frequência dos pagamentos para os professores.
              </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
              <div className='grid md:grid-cols-3 gap-4'>
                <div className="grid gap-2">
                    <Label htmlFor="teacher-payment-rate">Valor por Aula (R$)</Label>
                    <Input
                        id="teacher-payment-rate"
                        type="number"
                        value={teacherPaymentRate}
                        onChange={(e) => setTeacherPaymentRate(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder='Ex: 50.00'
                    />
                    <p className="text-sm text-muted-foreground">
                        Este valor será usado como base para calcular os pagamentos.
                    </p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="payment-frequency">Frequência</Label>
                    <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                        <SelectTrigger id="payment-frequency">
                            <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-sm text-muted-foreground">
                        Com que frequência os pagamentos são processados.
                    </p>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="payment-day">Dia do Pagamento</Label>
                    <Select value={paymentDay} onValueChange={setPaymentDay}>
                        <SelectTrigger id="payment-day">
                            <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Segunda-feira</SelectItem>
                            <SelectItem value="tuesday">Terça-feira</SelectItem>
                            <SelectItem value="wednesday">Quarta-feira</SelectItem>
                            <SelectItem value="thursday">Quinta-feira</SelectItem>
                            <SelectItem value="friday">Sexta-feira</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-sm text-muted-foreground">
                        Dia da semana para processar os pagamentos.
                    </p>
                </div>
              </div>
              <div className="flex">
                  <Button onClick={handleSaveTeacherPaymentSettings}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Salvar Configurações de Pagamento
                  </Button>
              </div>
          </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Configurações de Pagamento</CardTitle>
          <CardDescription>
            Configure as chaves de pagamento para as integrações da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2 max-w-md">
                <Label htmlFor="pix-key">Chave Pix</Label>
                <Input
                    id="pix-key"
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder='Cole sua chave Pix aqui'
                />
                <p className="text-sm text-muted-foreground">
                    Esta chave será usada para gerar QR Codes de pagamento via Pix.
                </p>
            </div>
             <div className="flex">
                <Button onClick={handleSavePixKey}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Salvar Chave Pix
                </Button>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Credenciais de API</CardTitle>
          <CardDescription>
            Gerencie as credenciais para integrações de terceiros como Google
            e PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de credenciais ainda não foi
            implementada.
          </p>
        </CardContent>
      </Card>
    </div>
    <AlertDialog
        open={!!adminToDelete}
        onOpenChange={() => setAdminToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              perfil de{' '}
              <span className="font-bold">{adminToDelete?.name}</span>,
              removerá seus dados de nossos servidores e cancelará todas as suas aulas futuras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
