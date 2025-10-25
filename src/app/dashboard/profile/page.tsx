
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMockUser, teachers as initialTeachers, subjects } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole, Teacher, User } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Mail,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Layers,
  Webhook,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type AvailabilitySlot = {
  start: string;
  end: string;
};

const TEACHERS_STORAGE_KEY = 'teacherList';

const CollapsibleCard = ({
    title,
    description,
    children,
    defaultOpen = false,
} : {
    title: string,
    description: string,
    children: React.ReactNode,
    defaultOpen?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            <span className="sr-only">{isOpen ? "Recolher" : "Expandir"}</span>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    {children}
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

const TrelloIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="h-6 w-6" fill="#0079BF">
      <path d="M19.52 3H4.48A1.48 1.48 0 003 4.48v15.04A1.48 1.48 0 004.48 21h15.04A1.48 1.48 0 0021 19.52V4.48A1.48 1.48 0 0019.52 3zM12.96 17.52h-2.4a.8.8 0 01-.8-.8v-8.8a.8.8 0 01.8-.8h2.4a.8.8 0 01.8.8v8.8a.8.8 0 01-.8.8zm-5.6-3.2h-2.4a.8.8 0 01-.8-.8V7.92a.8.8 0 01.8-.8h2.4a.8.8 0 01.8.8v5.6a.8.8 0 01-.8.8zm11.2 0h-2.4a.8.8 0 01-.8-.8V11.2a.8.8 0 01.8-.8h2.4a.8.8 0 01.8.8v3.12a.8.8 0 01-.8.8z"/>
    </svg>
);

const NotionIcon = () => (
  <svg role="img" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M22.5 3.375a.375.375 0 0 0-.375.375v16.5a.375.375 0 0 0 .375.375h.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-.75zM19.5 3.375A.375.375 0 0 0 19.125 3h-3.75a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375zM.375 3.375h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375H.375a.375.375 0 0 1-.375-.375V3.75A.375.375 0 0 1 .375 3.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zM12 3.375h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375H12a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375z" />
  </svg>
);

const TeacherProfileForm = ({ user, onUserChange }: { user: Teacher | User, onUserChange: (user: Teacher | User) => void }) => {
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    onUserChange({ ...user, [id]: value });
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if ('subjects' in user) {
        const currentSubjects = (user as Teacher).subjects || [];
        const newSubjects = checked
        ? [...currentSubjects, subjectId]
        : currentSubjects.filter(id => id !== subjectId);
        onUserChange({ ...user, subjects: newSubjects });
    }
  };

  const days = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ];

  const initialAvailability = days.reduce((acc, day) => {
    acc[day.id] = [{ start: '13:00', end: '21:00' }];
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  const [availability, setAvailability] = useState(initialAvailability);
  const [editingSlot, setEditingSlot] = useState<{ dayId: string; index: number } | null>(null);

  const handleAddSlot = (dayId: string) => {
    const newSlot = { start: '09:00', end: '12:00' };
    setAvailability((prev) => ({
      ...prev,
      [dayId]: [...(prev[dayId] || []), newSlot],
    }));
  };

  const handleEditSlot = (dayId: string, index: number) => {
    setEditingSlot({ dayId, index });
  }

  const handleCancelEdit = () => {
    setEditingSlot(null);
  };

  const handleSaveSlot = (dayId: string, index: number) => {
    const newStart = (document.getElementById(`start-${dayId}-${index}`) as HTMLInputElement).value;
    const newEnd = (document.getElementById(`end-${dayId}-${index}`) as HTMLInputElement).value;
    if (!newStart || !newEnd || newStart >= newEnd) {
        toast({
            variant: "destructive",
            title: "Horário Inválido",
            description: "O horário de início deve ser anterior ao horário de término."
        });
        return;
    }
    setAvailability(prev => {
        const newAvailability = { ...prev };
        newAvailability[dayId][index] = { start: newStart, end: newEnd };
        return newAvailability;
    });
    setEditingSlot(null);
  }

  const handleRemoveSlot = (dayId: string, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: prev[dayId].filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <div className="grid gap-6">
        <CollapsibleCard 
            title="Informações Pessoais" 
            description="Atualize seus dados, foto de perfil e informações de contato."
            defaultOpen={true}
        >
          <CardContent className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-4 md:col-span-1">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Button variant="outline">Alterar Foto</Button>
            </div>
            <div className="grid gap-4 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={user.name.split(' ')[0]}
                    onChange={(e) => {
                      const lastName = user.name.split(' ').slice(1).join(' ');
                      onUserChange({ ...user, name: `${e.target.value} ${lastName}`});
                    }}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Não aplicável"
                    value={user.name.split(' ').slice(1).join(' ')}
                     onChange={(e) => {
                      const firstName = user.name.split(' ')[0];
                      onUserChange({ ...user, name: `${firstName} ${e.target.value}`});
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nickname">Apelido (opcional)</Label>
                <Input id="nickname" value={user.nickname || ''} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={user.phone || ''}
                    onChange={handleInputChange}
                    placeholder="(DDD) 99999-9999"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="bio">Descrição (Bio)</Label>
              <Textarea
                id="bio"
                value={user.bio || ''}
                onChange={handleInputChange}
                rows={4}
                placeholder="Fale um pouco sobre sua experiência, metodologia e paixão por ensinar."
              />
            </div>
          </CardContent>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="education">Formação</Label>
              <Input
                id="education"
                value={user.education || ''}
                onChange={handleInputChange}
                placeholder="Ex: Mestrado em Física Aplicada - USP"
              />
            </div>
          </CardContent>
        </CollapsibleCard>

        { user.role === 'teacher' && 'subjects' in user && (
        <>
          <CollapsibleCard 
            title="Serviços" 
            description="Selecione as disciplinas que você leciona."
          >
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={(user as Teacher).subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                  />
                  <label
                    htmlFor={`subject-${subject.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {subject.name}
                  </label>
                </div>
              ))}
            </CardContent>
          </CollapsibleCard>

          <CollapsibleCard
            title="Disponibilidade"
            description="Defina os horários em que você pode dar aulas."
          >
            <CardContent className="grid gap-4">
              <TooltipProvider>
              {days.map((day) => (
                <div
                  key={day.id}
                  className="grid grid-cols-[120px_1fr] items-start gap-4 border-b pb-4 last:border-b-0"
                >
                  <h4 className="font-semibold pt-2">{day.label}</h4>
                  <div className="flex flex-col gap-2">
                    {(availability[day.id] || []).map((slot, index) => {
                      const isEditing = editingSlot?.dayId === day.id && editingSlot?.index === index;
                      
                      return (
                      <div key={index} className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Input type="time" id={`start-${day.id}-${index}`} defaultValue={slot.start} className="w-24"/>
                                <span className="mx-2">-</span>
                                <Input type="time" id={`end-${day.id}-${index}`} defaultValue={slot.end} className="w-24"/>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleSaveSlot(day.id, index)}>
                                        <Save className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Salvar horário</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Cancelar edição</p></TooltipContent>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                              <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                                <span>{slot.start}</span> - <span>{slot.end}</span>
                              </div>
                              <div className="flex items-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditSlot(day.id, index)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Editar horário</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleAddSlot(day.id)}>
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Adicionar novo horário</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(day.id, index)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Remover horário</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </>
                        )}
                      </div>
                    )})}
                    {(availability[day.id] || []).length === 0 && (
                      <Button
                          variant="outline"
                          className="mt-2 w-full sm:w-auto"
                          onClick={() => handleAddSlot(day.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Horário
                        </Button>
                    )}
                  </div>
                </div>
              ))}
              </TooltipProvider>
            </CardContent>
          </CollapsibleCard>
        
        </>
        )}


        <CollapsibleCard
            title="Integrações"
            description="Conecte suas contas para automatizar agendamentos e comunicações."
        >
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Calendar className="h-6 w-6 text-red-500" />
                <div>
                  <h4 className="font-semibold">Google Calendar</h4>
                  <p className="text-sm text-muted-foreground">
                    Sincronize sua disponibilidade e agendamentos.
                  </p>
                </div>
              </div>
              <Button variant="outline">Conectar</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Gmail</h4>
                  <p className="text-sm text-muted-foreground">
                    Envie confirmações e lembretes de aula.
                  </p>
                </div>
              </div>
              <Button variant="outline">Conectar</Button>
            </div>
            { user.role === 'admin' && (
                <>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <TrelloIcon />
                            <div>
                            <h4 className="font-semibold">Trello</h4>
                            <p className="text-sm text-muted-foreground">
                                Crie cartões para novos alunos e agendamentos.
                            </p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Briefcase className="h-6 w-6" style={{color: '#E65100'}} />
                            <div>
                            <h4 className="font-semibold">Rub.App</h4>
                            <p className="text-sm text-muted-foreground">
                                Automatize a gestão de contatos e funis de venda.
                            </p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <NotionIcon />
                            <div>
                            <h4 className="font-semibold">Notion</h4>
                            <p className="text-sm text-muted-foreground">
                                Crie páginas para alunos e registre o progresso.
                            </p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Layers className="h-6 w-6 text-black dark:text-white" />
                            <div>
                            <h4 className="font-semibold">Make</h4>
                            <p className="text-sm text-muted-foreground">
                                Crie cenários complexos de automação.
                            </p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Webhook className="h-6 w-6" style={{color: '#FF4F43'}} />
                            <div>
                            <h4 className="font-semibold">n8n</h4>
                            <p className="text-sm text-muted-foreground">
                                Integre com centenas de outros aplicativos.
                            </p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                </>
            )}
          </CardContent>
        </CollapsibleCard>
      </div>
    </>
  );
};

export default function ProfilePage() {
  const { toast } = useToast();
  const { firestore, user: authUser } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | Teacher | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        } else {
            const newUser = getMockUser(role);
            setCurrentUser(newUser);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
        }
    }
  }, []);

 const handleSaveChanges = () => {
    if (!currentUser) return;
    
    // Save to Firebase
    if (authUser && firestore) {
      const docRef = doc(firestore, 'users', authUser.uid);
      setDocumentNonBlocking(docRef, currentUser, { merge: true });
    }

    // Update localStorage for current user
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // If the user is a teacher, update the master teacher list as well
    if (currentUser.role === 'teacher') {
      const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
      let teacherList: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : [];
      
      const teacherIndex = teacherList.findIndex(t => t.id === currentUser.id);

      if (teacherIndex > -1) {
        // Update existing teacher
        teacherList[teacherIndex] = currentUser as Teacher;
      } else {
        // This case should ideally not happen if login flow is correct, but as a fallback:
        teacherList.push(currentUser as Teacher);
      }
      
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teacherList));
    }

    // Notify other tabs/components of the change
    window.dispatchEvent(new Event('storage'));

    toast({
      title: "Alterações Salvas!",
      description: "Suas informações de perfil foram atualizadas com sucesso.",
    });
  };

  if (!currentUser) return null; // or a loading spinner

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Configurações de Perfil
        </h1>
        <Button
            size="lg"
            onClick={handleSaveChanges}
            className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            Salvar Alterações
          </Button>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <TeacherProfileForm user={currentUser} onUserChange={setCurrentUser} />
      </div>
    </div>
  );
}
