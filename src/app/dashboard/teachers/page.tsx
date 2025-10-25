
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Star, BookOpen, UserPlus, Mail, Calendar, Edit, EyeOff, Eye, Trash2 } from 'lucide-react';
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
                                <Link href={`/dashboard/profile`}>
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil do professor
                                <span className="font-bold"> {teacher.name} </span> e removerá seus dados de nossos servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(teacher.id)}>
                                Continuar
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
        <CardDescription className="pt-1">{teacher.education}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {teacher.bio}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {!isAdmin && (
          <Button asChild className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Link href={`/dashboard/profile`}>Ver Perfil e Agendar</Link>
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
  const [inviteEmail, setInviteEmail] = useState('');
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
  
  const handleDeleteTeacher = (teacherId: string) => {
    const updatedList = teacherList.filter(t => t.id !== teacherId);
    setTeacherList(updatedList);
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));
    toast({
      title: 'Professor Excluído',
      description: 'O perfil do professor foi removido da plataforma.',
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
  
  const visibleTeachers =
    currentUser?.role === 'admin'
      ? teacherList
      : teacherList.filter(t => t.status === 'active');

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Nossos Professores
          </h1>
          {currentUser?.role === 'admin' && (
            <Button
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <UserPlus className="mr-2" />
              Convidar Professor
            </Button>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
