
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMockUser,
  subjects as initialSubjects,
  users as initialUsers,
  teachers as initialTeachers,
  scheduleEvents as initialSchedule
} from '@/lib/data';
import { User, Teacher, Subject, ScheduleEvent, UserRole } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Simulado {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  studentId: string;
  creatorId: string;
  createdAt: Date;
  status: 'Pendente' | 'Concluído';
}

const SIMULADOS_STORAGE_KEY = 'simuladosList';

export default function SimuladosPage() {
  const [currentUser, setCurrentUser] = useState<User | Teacher | null>(null);
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const updateData = () => {
      const role = localStorage.getItem('userRole') as UserRole;
      const storedUser = localStorage.getItem('currentUser');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser(role));

      const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
      setSimulados(storedSimulados ? JSON.parse(storedSimulados).map((s: any) => ({...s, createdAt: new Date(s.createdAt)})) : []);
      
      const storedUsers = localStorage.getItem('userList');
      setStudents(storedUsers ? JSON.parse(storedUsers).filter((u:User) => u.role === 'student') : initialUsers.filter(u => u.role === 'student'));

      // In a real app, subjects would likely come from a DB
      setAllSubjects(initialSubjects);
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);
  
  const myStudents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return students;
    if (currentUser.role === 'teacher') {
      const storedSchedule = localStorage.getItem('scheduleEvents');
      const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule) : initialSchedule;
      const myStudentIds = new Set(schedule.filter(e => e.teacherId === currentUser.id).map(e => e.studentId));
      return students.filter(s => myStudentIds.has(s.id));
    }
    return [];
  }, [currentUser, students]);

  const availableSubjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return allSubjects;
    if (currentUser.role === 'teacher') {
        const teacherUser = currentUser as Teacher;
        return allSubjects.filter(sub => teacherUser.subjects.includes(sub.id));
    }
    return [];
  }, [currentUser, allSubjects]);

  useEffect(() => {
    // Automatically select the subject if there's only one option
    if (availableSubjects.length === 1) {
      setSelectedSubject(availableSubjects[0].id);
    }
  }, [availableSubjects]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubject || !selectedStudent || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título, disciplina e aluno.',
      });
      return;
    }

    const newSimulado: Simulado = {
      id: `sim-${Date.now()}`,
      title,
      description,
      subjectId: selectedSubject,
      studentId: selectedStudent,
      creatorId: currentUser.id,
      createdAt: new Date(),
      status: 'Pendente',
    };

    const updatedSimulados = [...simulados, newSimulado];
    setSimulados(updatedSimulados);
    localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Simulado Criado!',
      description: 'O novo simulado foi adicionado à lista.',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedSubject('');
    setSelectedStudent('');
  };

  const handleDelete = (id: string) => {
    const updatedSimulados = simulados.filter(s => s.id !== id);
    setSimulados(updatedSimulados);
    localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
    window.dispatchEvent(new Event('storage'));
    toast({
      variant: 'destructive',
      title: 'Simulado Excluído',
      description: 'O simulado foi removido da lista.',
    });
  };

  const getSubjectName = (id: string) => allSubjects.find(s => s.id === id)?.name || 'Desconhecida';
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';

  const displayedSimulados = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return simulados;
    if (currentUser.role === 'teacher') {
        return simulados.filter(s => s.creatorId === currentUser.id);
    }
    // Student view
    return simulados.filter(s => s.studentId === currentUser.id);
  }, [currentUser, simulados]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
     return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center">
                <h1 className="font-headline text-2xl md:text-3xl font-bold">Simulados</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Meus Simulados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Você não tem permissão para criar simulados. Aqui você verá os simulados que foram designados a você.</p>
                </CardContent>
            </Card>
        </div>
     )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Simulados
        </h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Criar Novo Simulado/Exercício</CardTitle>
            <CardDescription>
              Crie um novo conjunto de exercícios para um aluno específico.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Simulado</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Revisão de Funções de 2º Grau"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecione uma disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="student">Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {myStudents.map((stu) => (
                      <SelectItem key={stu.id} value={stu.id}>
                        {stu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição/Instruções</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione instruções, links ou o conteúdo do exercício aqui."
                rows={4}
              />
            </div>
          </CardContent>
          <CardContent className="flex justify-end">
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Criar Simulado
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulados Criados</CardTitle>
          <CardDescription>
            Lista de todos os simulados criados por você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSimulados.length > 0 ? (
                displayedSimulados.map((sim) => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-medium max-w-xs truncate">{sim.title}</TableCell>
                    <TableCell>{getStudentName(sim.studentId)}</TableCell>
                    <TableCell>{getSubjectName(sim.subjectId)}</TableCell>
                    <TableCell>{format(sim.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>{sim.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sim.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum simulado criado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
