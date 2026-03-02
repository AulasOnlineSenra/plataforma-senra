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
import { subjects } from '@/lib/data';
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
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-yellow/50 hover:shadow-md cursor-pointer"
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
      {/* Detalhe de cor no topo do card */}
      <div className="h-24 w-full bg-slate-50 border-b border-slate-100 absolute top-0 left-0 z-0 transition-colors group-hover:bg-amber-50/50"></div>

      <CardHeader className="items-center text-center pb-2 pt-8 relative z-10">
         {isAdmin && (
            <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-full border border-slate-100 bg-white/80 backdrop-blur-md p-1 shadow-sm opacity-100 md:opacity-0 transition-opacity group-hover:opacity-100">
                {teacher.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                    onClick={(e) => { e.stopPropagation(); onApprove(teacher.id); }}
                    title="Aprovar Professor"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-brand-yellow hover:bg-amber-100" onClick={(e) => { e.stopPropagation(); onEdit(teacher); }} title="Editar Dados">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); if(confirm('Excluir este professor permanentemente?')) onDelete(teacher.id); }} title="Excluir Professor">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
        
        <Avatar className="mb-4 h-24 w-24 border-4 border-white shadow-md transition-transform group-hover:scale-105 bg-white">
          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} className="object-cover" />
          <AvatarFallback className="text-3xl font-bold bg-slate-100 text-slate-400">{teacher.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <CardTitle className="font-headline text-xl text-slate-900 tracking-tight">{teacher.name}</CardTitle>
        
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
             <Badge variant="secondary" className="border-none bg-slate-100 font-semibold text-slate-600 px-3 py-1 rounded-full">
               {teacher.subject || 'Geral'}
             </Badge>
             {teacher.status === 'pending' && (
               <Badge className="border-none bg-amber-100 font-bold text-amber-700 px-3 py-1 rounded-full shadow-none">
                 Pendente
               </Badge>
             )}
             {teacher.status !== 'pending' && (
               <Badge className="border-none bg-emerald-50 font-bold text-emerald-600 px-3 py-1 rounded-full shadow-none">
                 Ativo
               </Badge>
             )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 text-center relative z-10">
        <p className="text-sm font-medium text-slate-400 truncate px-4">{teacher.email}</p>
      </CardContent>
      
      <CardFooter className="flex-col gap-2 pt-0 pb-6 px-6 relative z-10">
        {!isAdmin && (
          <Button asChild className="w-full h-11 rounded-xl bg-brand-yellow font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90">
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const result = await createTeacher({ name: formData.name, email: formData.email, password: formData.password, subject: formData.subject });
      
      if (result.success) {
          toast({ title: 'Sucesso!', description: 'Professor cadastrado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
          setIsCreateOpen(false);
          setFormData({ id: '', name: '', email: '', password: '', subject: '' });
          fetchDBTeachers(); 
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
      setIsSubmitting(false);
  };

  const openEditModal = (teacher: any) => {
      setFormData({ id: teacher.id, name: teacher.name, email: teacher.email, password: '', subject: teacher.subject || '' });
      setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const result = await updateTeacher(formData.id, { name: formData.name, email: formData.email, subject: formData.subject });
      
      if (result.success) {
          toast({ title: 'Sucesso!', description: 'Dados do professor atualizados.', className: 'bg-emerald-600 text-white border-none' });
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
          toast({ title: 'Sucesso!', description: 'Professor aprovado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
          fetchDBTeachers();
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao aprovar professor.' });
      }
  };

  if (isLoading) {
      return <div className="flex h-[50vh] items-center justify-center text-slate-400 animate-pulse font-medium">Buscando professores...</div>;
  }

  return (
    <>
      <div id="teacher-list" className="mx-auto flex w-full flex-1 flex-col gap-6 md:gap-8">
        
        {/* HEADER LIMPO E MODERNO */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Corpo Docente</h1>
              <p className="mt-1 text-slate-500">Gerencie a equipe de professores da plataforma.</p>
          </div>
          
          <div className="flex gap-2 items-center w-full md:w-auto">
            {currentUser?.role === 'admin' && (
              <Button 
                onClick={() => { setFormData({ id: '', name: '', email: '', password: '', subject: '' }); setIsCreateOpen(true); }}
                className="w-full md:w-auto h-12 rounded-xl bg-brand-yellow px-6 text-base font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90"
              >
                <UserPlus className="mr-2 h-5 w-5" /> Novo Professor
              </Button>
            )}
          </div>
        </div>

        {teacherList.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-slate-400">
                <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-lg font-bold text-slate-600">Nenhum professor encontrado.</p>
                {currentUser?.role === 'admin' && <p className="text-sm mt-1 text-slate-500">Clique em "Novo Professor" para cadastrar a equipe.</p>}
            </div>
        ) : (
            <div className="mt-2 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Novo Professor</DialogTitle>
            <DialogDescription className="text-slate-500">Crie o acesso de um novo professor na plataforma.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Nome Completo</Label>
              <Input className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Maria Silva" required />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">E-mail de Acesso</Label>
              <Input className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="professor@senra.com" required />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Matéria Principal</Label>
              <Select value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-brand-yellow">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {subjects.map(subj => (
                    <SelectItem key={subj.id} value={subj.name} className="cursor-pointer">{subj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Senha Temporária</Label>
              <Input className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" required />
            </div>
            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-700">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90">{isSubmitting ? 'Salvando...' : 'Cadastrar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR PROFESSOR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Editar Professor</DialogTitle>
            <DialogDescription className="text-slate-500">Altere as informações de cadastro deste professor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Nome Completo</Label>
              <Input className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">E-mail</Label>
              <Input className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Matéria Principal</Label>
              <Select value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-brand-yellow">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {subjects.map(subj => (
                    <SelectItem key={subj.id} value={subj.name} className="cursor-pointer">{subj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-700">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90">{isSubmitting ? 'Atualizando...' : 'Atualizar Dados'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}