
'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { teachers as initialTeachers, subjects, getMockUser } from '@/lib/data';
import { Teacher, UserRole, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, UserPlus, Mail, Calendar, Edit, EyeOff, Eye, Trash2, RotateCcw, AlertTriangle, Plus, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TeacherCard({
  teacher,
  currentUser,
  onDelete,
  onToggleVisibility,
}: {
  teacher: Teacher;
  currentUser: User | null;
  onDelete: (teacherId: string) => void;
  onToggleVisibility: (teacherId: string) => void;
}) {
  const teacherSubjects = teacher.subjects
    .map((subjectId) => subjects.find((s) => s.id === subjectId)?.name)
    .filter(Boolean);

  // Mock rating for demonstration
  const rating = 4.5 + (parseInt(teacher.id.slice(-1), 16) % 5) / 10;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <Card className={cn(
        "flex flex-col transition-opacity",
        teacher.status === 'hidden' && 'opacity-60 bg-muted/50'
    )}>
      <CardHeader className="items-center text-center relative">
         {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <Link href={`/dashboard/profile?userId=${teacher.id}`}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver / Editar Perfil</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleVisibility(teacher.id)}>
                                {teacher.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{teacher.status === 'active' ? 'Ocultar' : 'Mostrar'}</p></TooltipContent>
                    </Tooltip>
                     <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Excluir Professor</p></TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação moverá o professor para a lista de excluídos. Ele poderá ser restaurado ou excluído permanentemente mais tarde.
                                O professor <span className="font-bold">{teacher.name}</span> não será mais visível para os alunos.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-brand-yellow text-black hover:bg-brand-yellow/90" onClick={() => onDelete(teacher.id)}>
                                Mover para Excluídos
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TooltipProvider>
            </div>
        )}
        <Avatar className="h-24 w-24 mb-4 mt-8 sm:mt-0">
          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline text-xl">{teacher.name}</CardTitle>
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {teacherSubjects.map((subjectName) => (
            <Badge key={subjectName} variant="secondary">
              {subjectName}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 pt-3">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          <span className="text-sm text-muted-foreground ml-1">
            ({rating.toFixed(1)})
          </span>
        </div>
        <CardDescription className="pt-1">{teacher.education && Array.isArray(teacher.education) ? teacher.education[0]?.course : ''}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {teacher.bio}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {!isAdmin && (
          <Button asChild className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Link href={`/dashboard/booking?teacherId=${teacher.id}`}>Agendar</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const TEACHERS_STORAGE_KEY = 'teacherList';

export default function TeachersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherList, setTeacherList] = useState<Teacher[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const { toast } = useToast();

  const updateTeacherList = useCallback(() => {
    const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (storedTeachers) {
      try {
        setTeacherList(JSON.parse(storedTeachers));
      } catch (e) {
        console.error("Failed to parse teachers from localStorage", e);
        setTeacherList(initialTeachers);
      }
    } else {
      setTeacherList(initialTeachers);
    }
  }, []);


  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setCurrentUser(getMockUser(role));
    }
    
    updateTeacherList();

    window.addEventListener('storage', updateTeacherList);

    return () => {
      window.removeEventListener('storage', updateTeacherList);
    };
  }, [updateTeacherList]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#teacher-list') {
      const element = document.getElementById('teacher-list');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('animate-highlight');
        setTimeout(() => {
          element.classList.remove('animate-highlight');
        }, 2000);
      }
    }
  }, []);

  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, insira um endereço de email válido.',
      });
      return;
    }
    // In a real app, you would send an invitation email via a backend service.
    console.log(`Sending invite to: ${inviteEmail}`);
    toast({
      title: 'Convite Enviado!',
      description: `Um convite foi enviado para ${inviteEmail}.`,
    });
    setInviteEmail('');
    setIsInviteDialogOpen(false);
  };
  
    const handleRegisterTeacher = () => {
    if (!registerName || !registerEmail) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome e o email.',
      });
      return;
    }
    const newTeacher = getMockUser('teacher', { name: registerName, email: registerEmail }) as Teacher;
    
    const updatedList = [...teacherList, newTeacher];
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Professor Cadastrado!',
      description: `${registerName} foi adicionado à plataforma.`,
    });
    setRegisterName('');
    setRegisterEmail('');
    setIsRegisterDialogOpen(false);
  };

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    toast({
      title: 'Processando arquivo...',
      description: `Lendo ${file.name}.`,
    });
  
    setTimeout(() => {
      const mockNewTeachersData = [
        { name: 'Carlos Exemplo', email: 'carlos.ex@example.com' },
        { name: 'Fernanda Exemplo', email: 'fernanda.ex@example.com' },
      ];
  
      const existingEmails = new Set(teacherList.map(t => t.email.toLowerCase()));
      
      const newTeachersToAdd = mockNewTeachersData
        .filter(data => !existingEmails.has(data.email.toLowerCase()))
        .map(data => getMockUser('teacher', { name: data.name, email: data.email }) as Teacher);
  
      if (newTeachersToAdd.length === 0) {
        toast({
          title: 'Importação Concluída',
          description: 'Nenhum professor novo foi adicionado, pois todos já estavam na plataforma.',
        });
        setIsImportDialogOpen(false);
        return;
      }
  
      const updatedList = [...teacherList, ...newTeachersToAdd];
      setTeacherList(updatedList);
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: 'Importação Concluída!',
        description: `${newTeachersToAdd.length} novos professores foram adicionados.`,
      });
      setIsImportDialogOpen(false);
    }, 2000);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const updatedList = teacherList.map(t =>
        t.id === teacherId ? { ...t, status: 'deleted' as const } : t
    );
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    toast({
      title: 'Professor Movido para Excluídos',
      description: 'O perfil do professor foi movido para a lista de excluídos.',
    });
  };

  const handleToggleVisibility = (teacherId: string) => {
    const updatedList = teacherList.map(t =>
        t.id === teacherId
          ? { ...t, status: t.status === 'active' ? 'hidden' : 'active' }
          : t
      );
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
  };

  const handleRestoreTeacher = (teacherId: string) => {
    const updatedList = teacherList.map(t =>
        t.id === teacherId ? { ...t, status: 'active' as const } : t
    );
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    toast({
      title: 'Professor Restaurado',
      description: 'O perfil do professor está ativo novamente.',
    });
  };
  
  const handlePermanentDeleteTeacher = (teacherId: string) => {
    const updatedList = teacherList.filter(t => t.id !== teacherId);
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    toast({
      variant: 'destructive',
      title: 'Professor Excluído Permanentemente',
      description: 'O perfil do professor foi removido para sempre.',
    });
  };
  
  const visibleTeachers =
    currentUser?.role === 'admin'
      ? teacherList.filter(t => t.status !== 'deleted')
      : teacherList.filter(t => t.status === 'active');
  
  const deletedTeachers =
    currentUser?.role === 'admin'
      ? teacherList.filter(t => t.status === 'deleted')
      : [];

  return (
    <>
      <div id="teacher-list" className="flex flex-1 flex-col gap-4 md:gap-8 overflow-hidden">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Nossos Professores
          </h1>
          {currentUser?.role === 'admin' && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
              >
                <Upload className="mr-2" />
                Importar
              </Button>
              <Button
                onClick={() => setIsRegisterDialogOpen(true)}
                variant="outline"
              >
                <Plus className="mr-2" />
                Cadastrar
              </Button>
              <Button
                onClick={() => setIsInviteDialogOpen(true)}
                className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <UserPlus className="mr-2" />
                Convidar
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 -mx-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4">
            {visibleTeachers.map((teacher) => (
                <TeacherCard
                key={teacher.id}
                teacher={teacher}
                currentUser={currentUser}
                onDelete={handleDeleteTeacher}
                onToggleVisibility={handleToggleVisibility}
                />
            ))}
            </div>
            {currentUser?.role === 'admin' && (
                <div className="px-4 mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Professores Excluídos</CardTitle>
                            <CardDescription>
                                Professores que foram removidos da plataforma. Você pode restaurá-los ou excluí-los permanentemente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Professor</TableHead>
                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedTeachers.length > 0 ? (
                                        deletedTeachers.map(teacher => (
                                            <TableRow key={teacher.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">{teacher.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">{teacher.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => handleRestoreTeacher(teacher.id)}>
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Restaurar Professor</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <AlertDialog>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Excluir Permanentemente</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle />Você tem certeza absoluta?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação não pode ser desfeita. O professor <span className="font-bold">{teacher.name}</span> será excluído para sempre.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handlePermanentDeleteTeacher(teacher.id)}>
                                                                    Excluir Permanentemente
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                Nenhum professor na lista de excluídos.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </ScrollArea>
      </div>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Novo Professor</DialogTitle>
            <DialogDescription>
              Insira o email do professor que você deseja convidar para a
              plataforma. Ele receberá um link para completar o cadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-invite">Email do Professor</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-invite"
                  type="email"
                  placeholder="nome.sobrenome@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSendInvite}>
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Professor</DialogTitle>
            <DialogDescription>
              Insira os dados básicos para criar um novo perfil de professor na plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name-register">Nome Completo</Label>
              <Input
                id="name-register"
                type="text"
                placeholder="Nome do professor"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email-register">Email do Professor</Label>
              <Input
                id="email-register"
                type="email"
                placeholder="email@exemplo.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleRegisterTeacher}>
              Cadastrar Professor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Importar Professores de Planilha</DialogTitle>
                <DialogDescription>
                    Faça o upload de um arquivo .csv ou .xlsx para adicionar múltiplos professores de uma só vez.
                    Certifique-se de que sua planilha tenha as colunas "Nome Completo" e "Email".
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <div className="flex items-center justify-center w-full">
                    <Label
                        htmlFor="dropzone-file"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-muted-foreground">CSV, XLSX (MAX. 2MB)</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileImport} />
                    </Label>
                </div>
                 <div className="mt-4 text-center">
                    <Button variant="link" asChild>
                        <a href="/templates/modelo_professores.csv" download>
                            Baixar planilha modelo (.csv)
                        </a>
                    </Button>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Fechar
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
