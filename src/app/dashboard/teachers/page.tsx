
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { teachers, subjects, getMockUser } from '@/lib/data';
import { Teacher, UserRole, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, UserPlus, Mail, Calendar, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
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

function TeacherCard({ teacher, currentUser }: { teacher: Teacher, currentUser: User | null }) {
  const teacherSubjects = teacher.subjects
    .map((subjectId) => subjects.find((s) => s.id === subjectId)?.name)
    .filter(Boolean);

  // Mock rating for demonstration
  const rating = 4.5 + (parseInt(teacher.id.slice(-1), 16) % 5) / 10;
  
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
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
        {isAdmin ? (
          <>
            <Button asChild className="w-full">
              <Link href={`/dashboard/profile`}>
                <Edit /> Ver/Editar Perfil
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/schedule">
                <Calendar /> Ver Agenda
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Link href={`/dashboard/profile`}>Ver Perfil e Agendar</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function TeachersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setCurrentUser(getMockUser(role));
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} currentUser={currentUser} />
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
