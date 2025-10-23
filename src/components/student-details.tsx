

'use client';

import { User } from '@/lib/types';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Mail, Phone, Clock, Calendar, CheckCircle, BookOpen, Plus, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from './ui/button';
import Link from 'next/link';

interface StudentDetailsProps {
  student: User;
}

const mockActivities = [
  { action: 'Agendou aula de Matemática', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { action: 'Comprou pacote de 8 aulas', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { action: 'Concluiu aula de Física', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { action: 'Enviou mensagem para Ana Silva', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
];


export function StudentDetails({ student }: StudentDetailsProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <SheetHeader className="text-left mb-6">
            <div className='flex items-center gap-4'>
                <Avatar className="h-16 w-16">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <SheetTitle className="text-2xl font-headline">{student.name}</SheetTitle>
                    <SheetDescription>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={student.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </SheetDescription>
                </div>
            </div>
        </SheetHeader>
        
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.email}</span>
                    </div>
                    {student.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{student.phone}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Button asChild>
                        <Link href={`/dashboard/booking?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`}>
                            <Plus /> Agendar Nova Aula
                        </Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/dashboard/schedule">
                            <XCircle /> Cancelar Aula
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-accent/50">
                        <CheckCircle className="h-7 w-7 mx-auto text-primary" />
                        <p className="text-2xl font-bold mt-2">28</p>
                        <p className="text-xs text-muted-foreground">Aulas Concluídas</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                        <BookOpen className="h-7 w-7 mx-auto text-primary" />
                        <p className="text-2xl font-bold mt-2">4</p>
                        <p className="text-xs text-muted-foreground">Pacotes Comprados</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {mockActivities.map((activity, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm">
                                <div className="pt-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(activity.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
