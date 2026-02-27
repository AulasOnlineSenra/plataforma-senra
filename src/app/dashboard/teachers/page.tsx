'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, UserPlus, Edit, Trash2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { subjects } from '@/lib/data'; // Importando a lista de matérias
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// IMPORTANDO AS FUNÇÕES DO MOTOR
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, approveTeacher } from '@/app/actions/users';

function TeacherCard({
  teacher,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  onOpenDetails,
}: {
  teacher: any;
  currentUser: any;
  onEdit: (t: any) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Card
      className="flex flex-col transition-all hover:ring-2 hover:ring-brand-yellow relative overflow-hidden"
      onClick={() => isAdmin && onOpenDetails(teacher.id)}
      role={isAdmin ? 'button' : undefined}
      tabIndex={isAdmin ? 0 : -1}
      onKeyDown={(event) => {
        if (!isAdmin) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(teacher.id);
        }
      }}
    >
      <CardHeader className="items-center text-center pb-2">
         {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/80 rounded-lg p-1 shadow-sm">
                {teacher.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={(e) => { e.stopPropagation(); onApprove(teacher.id); }}
                    title="Aprovar Professor"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand-yellow hover:bg-amber-50" onClick={(e) => { e.stopPropagation(); onEdit(teacher); }} title="Editar Dados">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); if(confirm('Excluir este professor permanentemente?')) onDelete(teacher.id); }} title="Excluir Professor">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
        <Avatar className="h-24 w-24 mb-3 shadow-md border-2 border-slate-100">
          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
          <AvatarFallback className="text-2xl font-bold bg-amber-100 text-amber-700">{teacher.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline text-xl text-slate-800">{teacher.name}</CardTitle>
        <div className="mt-2">
             <Badge variant="secondary" className="bg-brand-yellow/20 text-slate-800 border-none font-semibold">
               Professor(a) {teacher.subject ? `de ${teacher.subject}` : ''}
             </Badge>
             {teacher.status === 'pending' && (
               <Badge className="ml-2 bg-amber-100 text-amber-800 border-none font-semibold">
                 Pendente
               </Badge>
             )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-center">
        <p className="text-sm text-slate-500 truncate px-2">{teacher.email}</p>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-0 pb-6 px-6">
        {!isAdmin && (
          <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all hover:scale-[1.02]">
            <Link href={`/dashboard/booking?teacherId=${teacher.id}`}>Agendar Aula</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}


export default function TeachersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Agora o formulário guarda a matéria (subject)
  const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', subject: '' });

  const fetchDBTeachers = async () => {
      setIsLoading(true);
      const result = await getTeachers();
      if (result.success && result.data) {
          setTeacherList(result.data);
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível buscar os professores.' });
      }
      setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchDBTeachers();
  }, []);

  // CRIAR
  const handleCreateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const result = await createTeacher({ name: formData.name, email: formData.email, password: formData.password, subject: formData.subject });
      
      if (result.success) {
          toast({ title: 'Sucesso!', description: 'Professor cadastrado com sucesso.' });
          setIsCreateOpen(false);
          setFormData({ id: '', name: '', email: '', password: '', subject: '' });
          fetchDBTeachers(); 
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
      setIsSubmitting(false);
  };

  // ABRIR MODAL DE EDIÇÃO
  const openEditModal = (teacher: any) => {
      setFormData({ id: teacher.id, name: teacher.name, email: teacher.email, password: '', subject: teacher.subject || '' });
      setIsEditOpen(true);
  };

  // SALVAR EDIÇÃO
  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const result = await updateTeacher(formData.id, { name: formData.name, email: formData.email, subject: formData.subject });
      
      if (result.success) {
          toast({ title: 'Sucesso!', description: 'Dados do professor atualizados.' });
          setIsEditOpen(false);
          fetchDBTeachers();
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
      setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
      const result = await deleteTeacher(id);
      if (result.success) {
          toast({ title: 'Excluído!', description: 'Professor removido da plataforma.' });
          fetchDBTeachers();
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
  };

  const handleApprove = async (id: string) => {
      const result = await approveTeacher(id);
      if (result.success) {
          toast({ title: 'Sucesso!', description: 'Professor aprovado com sucesso.' });
          fetchDBTeachers();
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao aprovar professor.' });
      }
  };

  if (isLoading) {
      return <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">Buscando professores...</div>;
  }

  return (
    <>
      <div id="teacher-list" className="flex flex-1 flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full p-4">
        <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900">Corpo Docente</h1>
              <p className="text-slate-500 mt-1">Gerencie a equipe de professores da plataforma.</p>
          </div>
          
          <div className="flex gap-2 items-center">
            {currentUser?.role === 'admin' && (
              <Button 
                onClick={() => { setFormData({ id: '', name: '', email: '', password: '', subject: '' }); setIsCreateOpen(true); }}
                className="bg-brand-yellow text-slate-900 hover:bg-amber-400 font-bold shadow-md"
              >
                <UserPlus className="mr-2 h-4 w-4" /> Novo Professor
              </Button>
            )}
          </div>
        </div>

        {teacherList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed rounded-2xl bg-slate-50/50 mt-4">
                <BookOpen className="w-16 h-16 opacity-30 mb-4" />
                <p className="text-lg font-medium text-slate-600">Nenhum professor encontrado.</p>
                {currentUser?.role === 'admin' && <p className="text-sm mt-1">Clique em "Novo Professor" para cadastrar a equipe.</p>}
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {teacherList.map((teacher) => (
                <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    currentUser={currentUser}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onOpenDetails={(teacherId) => router.push(`/dashboard/student/${teacherId}`)}
                />
            ))}
            </div>
        )}
      </div>

      {/* MODAL DE CRIAR PROFESSOR */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Professor</DialogTitle>
            <DialogDescription>Crie o acesso de um novo professor na plataforma.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Maria Silva" required />
            </div>
            <div className="grid gap-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="professor@senra.com" required />
            </div>
            <div className="grid gap-2">
              <Label>Matéria Principal</Label>
              <Select value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subj => (
                    <SelectItem key={subj.id} value={subj.name}>{subj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Senha Temporária</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" required />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">{isSubmitting ? 'Salvando...' : 'Salvar Professor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR PROFESSOR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Dados do Professor</DialogTitle>
            <DialogDescription>Altere as informações de cadastro deste professor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label>Matéria Principal</Label>
              <Select value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subj => (
                    <SelectItem key={subj.id} value={subj.name}>{subj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-yellow text-slate-900 hover:bg-amber-400 font-bold">{isSubmitting ? 'Atualizando...' : 'Atualizar Dados'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
