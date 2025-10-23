
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMockUser, teachers, subjects } from '@/lib/data';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AvailabilitySlot = {
  start: string;
  end: string;
};

const TeacherProfileForm = ({ onSave, user }: { onSave: (data: Teacher) => void; user: Teacher }) => {
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher>(user);

  useEffect(() => {
    setTeacher(user);
  }, [user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setTeacher(prev => ({ ...prev, [id]: value }));
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    setTeacher(prev => {
      const newSubjects = checked
        ? [...(prev.subjects || []), subjectId]
        : (prev.subjects || []).filter(id => id !== subjectId);
      return { ...prev, subjects: newSubjects };
    });
  };

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
  
  const handleSaveChanges = () => {
    onSave(teacher);
  }


  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados, foto de perfil e informações de contato.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-4 md:col-span-1">
              <Avatar className="h-32 w-32">
                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                <AvatarFallback>{teacher.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Button variant="outline">Alterar Foto</Button>
            </div>
            <div className="grid gap-4 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={teacher.name.split(' ')[0]}
                    onChange={(e) => {
                      const lastName = teacher.name.split(' ').slice(1).join(' ');
                      setTeacher(prev => ({...prev, name: `${e.target.value} ${lastName}`}))
                    }}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Não aplicável"
                    value={teacher.name.split(' ').slice(1).join(' ')}
                    onChange={(e) => {
                      const firstName = teacher.name.split(' ')[0];
                      setTeacher(prev => ({...prev, name: `${firstName} ${e.target.value}`}))
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nickname">Apelido (opcional)</Label>
                <Input id="nickname" value={teacher.nickname} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={teacher.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={teacher.phone}
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
                value={teacher.bio}
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
                value={teacher.education}
                onChange={handleInputChange}
                placeholder="Ex: Mestrado em Física Aplicada - USP"
              />
            </div>
          </CardContent>
        </Card>

        { teacher.role === 'teacher' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
              <CardDescription>
                Selecione as disciplinas que você leciona.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={(teacher.subjects || []).includes(subject.id)}
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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade</CardTitle>
              <CardDescription>
                Defina os horários em que você pode dar aulas. Estes horários ficarão disponíveis para agendamento dos alunos.
              </CardDescription>
            </CardHeader>
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
          </Card>
        
        </>
        )}


        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>
              Conecte suas contas para automatizar agendamentos e comunicações.
            </CardDescription>
          </CardHeader>
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
          </CardContent>
        </Card>
      </div>
       <div className="flex justify-end mt-8">
          <Button
            size="lg"
            onClick={handleSaveChanges}
          >
            Salvar Alterações
          </Button>
        </div>
    </>
  );
};

const StudentProfileForm = ({ onSave, user }: { onSave: (data: User) => void; user: User }) => {
  const [student, setStudent] = useState<User>(user);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setStudent(user);
  }, [user]);
  
  if (!student) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setStudent(prev => prev ? { ...prev, [id]: value } : null);
  };
  
  const handleSaveChanges = () => {
    onSave(student);
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Mantenha seus dados atualizados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" value={student.name} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={student.email} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Deixe em branco para não alterar"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
         <CardFooter>
          <Button
            className="w-full"
            onClick={handleSaveChanges}
          >
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
  );
};

export default function ProfilePage() {
  const { toast } = useToast();
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

  const handleSaveChanges = (data: User | Teacher) => {
    setCurrentUser(data);
    localStorage.setItem('currentUser', JSON.stringify(data));
    // This custom event is to notify the sidebar to update
    window.dispatchEvent(new Event('storage'));
    
    toast({
      title: "Alterações Salvas!",
      description: "Suas informações de perfil foram atualizadas com sucesso.",
    });
  };

  if (!currentUser) return null; // or a loading spinner

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">
          Configurações de Perfil
        </h1>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        {currentUser.role === 'teacher' || currentUser.role === 'admin' ? (
            <TeacherProfileForm onSave={handleSaveChanges} user={currentUser as Teacher} />
        ) : (
            <StudentProfileForm onSave={handleSaveChanges} user={currentUser as User} />
        )}
      </div>
    </div>
  );
}
