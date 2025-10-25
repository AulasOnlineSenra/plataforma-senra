

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { getMockUser, teachers as initialTeachers, subjects, allUsers as initialAllUsers } from '@/lib/data';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type AvailabilitySlot = {
  start: string;
  end: string;
};

const TEACHERS_STORAGE_KEY = 'teacherList';
const USERS_STORAGE_KEY = 'userList';


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
    <path d="M2.25 3.75C2.25 2.925 2.925 2.25 3.75 2.25h16.5c.825 0 1.5.675 1.5-1.5V3.75c0-.825-.675-1.5-1.5-1.5zM8.062 17.438l-3-3.375a.375.375 0 11.54-.48l2.715 3.045 4.125-4.5a.375.375 0 01.45-.06.375.375 0 01.09.245V17.25h-4.875zm-.75-9.375h3.375v2.625H7.312V8.062zm8.25 9.375h-3.375V14.25h3.375v3.188zM12 5.25a.375.375 0 01-.15.3l-4.5 3a.375.375 0 01-.45-.09l-3-4.125a.375.375 0 11.48-.54l2.745 3.75 4.2-2.8a.375.375 0 01.375.255V5.25z" />
  </svg>
);

function ProfilePageComponent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for form fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState<string[]>(['']);
  
  // Teacher-specific state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, AvailabilitySlot[]>>({});

  useEffect(() => {
    // Determine the logged-in user
    const role = localStorage.getItem('userRole') as UserRole | null;
    const storedUser = localStorage.getItem('currentUser');
    let currentUser: User | Teacher | null = null;
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else if (role) {
        currentUser = getMockUser(role);
    }
    setLoggedInUser(currentUser);

    // Determine which user's profile to display
    let userToDisplay: User | Teacher | null = null;
    if (userId && currentUser?.role === 'admin') {
      const allTeachers: Teacher[] = JSON.parse(localStorage.getItem(TEACHERS_STORAGE_KEY) || JSON.stringify(initialTeachers));
      const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || JSON.stringify(initialAllUsers));
      userToDisplay = [...allTeachers, ...allUsers].find(u => u.id === userId) || null;
    } else {
      userToDisplay = currentUser;
    }
    
    setProfileUser(userToDisplay);

    if (userToDisplay) {
      setName(userToDisplay.name);
      setNickname(userToDisplay.nickname || '');
      setBio(userToDisplay.bio || '');

      // Ensure education is always an array
      if (Array.isArray(userToDisplay.education)) {
        setEducation(userToDisplay.education);
      } else if (typeof userToDisplay.education === 'string') {
        setEducation([userToDisplay.education]);
      } else {
        setEducation(['']);
      }
      
      if (userToDisplay.role === 'teacher') {
        setSelectedSubjects((userToDisplay as Teacher).subjects || []);
      }
    }
  }, [userId]);

  const handleSaveChanges = () => {
    if (!profileUser) return;
    
    let updatedUser: User | Teacher;

    if (profileUser.role === 'teacher') {
      const updatedTeacher: Teacher = {
        ...(profileUser as Teacher),
        name,
        nickname,
        bio,
        education,
        subjects: selectedSubjects
      };
      updatedUser = updatedTeacher;

      const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
      const allTeachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
      const updatedTeacherList = allTeachers.map(t => t.id === updatedUser.id ? updatedUser : t);
      
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedTeacherList));

    } else {
        updatedUser = {
            ...profileUser,
            name,
            nickname,
            bio,
            education,
            role: profileUser.role, // ensure role is not lost
        }
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialAllUsers;
        const updatedUserList = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUserList));
    }

    // If the admin is editing another user, we don't update the logged-in user's info.
    if(loggedInUser?.id === updatedUser.id) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    setProfileUser(updatedUser);
    window.dispatchEvent(new Event('storage'));

    toast({
      title: "Perfil Atualizado!",
      description: "As informações foram salvas com sucesso.",
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    if(!profileUser) return;
    setName(profileUser.name);
    setNickname(profileUser.nickname || '');
    setBio(profileUser.bio || '');

    if (Array.isArray(profileUser.education)) {
        setEducation(profileUser.education);
    } else if (typeof profileUser.education === 'string') {
        setEducation([profileUser.education]);
    } else {
        setEducation(['']);
    }

    if (profileUser.role === 'teacher') {
        setSelectedSubjects((profileUser as Teacher).subjects || []);
    }
    setIsEditing(false);
  }
  
  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    setSelectedSubjects(prev => 
        checked ? [...prev, subjectId] : prev.filter(id => id !== subjectId)
    )
  }
  
  const handleEducationChange = (index: number, value: string) => {
    const newEducation = [...education];
    newEducation[index] = value;
    setEducation(newEducation);
  }
  
  const handleAddEducation = () => {
    setEducation([...education, '']);
  }
  
  const handleRemoveEducation = (index: number) => {
    if (education.length > 1) {
        const newEducation = education.filter((_, i) => i !== index);
        setEducation(newEducation);
    }
  }

  if (!profileUser) {
    return null; // or loading spinner
  }

  const canEdit = loggedInUser?.role === 'admin' || loggedInUser?.id === profileUser.id;


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Perfil de {name.split(' ')[0]}
        </h1>
        {canEdit && (
            <div className="ml-auto flex items-center gap-2">
                {isEditing ? (
                    <>
                       <Button variant="ghost" onClick={handleCancel}>
                            <X className="mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveChanges}>
                            <Save className="mr-2" />
                            Salvar Alterações
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2" />
                        Editar Perfil
                    </Button>
                )}
            </div>
        )}
      </div>
      
      <div className="grid gap-6">
        <CollapsibleCard title="Informações Pessoais" description="Edite seus dados pessoais e de contato." defaultOpen={true}>
            <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 sm:col-span-2">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileUser.avatarUrl} alt={profileUser.name} />
                      <AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-2 flex-1">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} placeholder="Seu nome completo"/>
                    </div>
                     <div className="grid gap-2 flex-1">
                        <Label htmlFor="nickname">Apelido (opcional)</Label>
                        <Input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} disabled={!isEditing} placeholder="Como você gosta de ser chamado(a)"/>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" value={profileUser.email} disabled className="pl-10" />
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="joined">Membro Desde</Label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="joined" value="Janeiro de 2024" disabled className="pl-10"/>
                    </div>
                </div>
            </CardContent>
             <CardContent>
                 <div className="grid gap-2">
                    <Label htmlFor="bio">Sua Bio</Label>
                    <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} disabled={!isEditing} placeholder="Fale um pouco sobre você, seus objetivos e interesses..." rows={4}/>
                 </div>
             </CardContent>
        </CollapsibleCard>

        {profileUser.role === 'teacher' && (
            <>
                <CollapsibleCard title="Perfil de Professor" description="Detalhes sobre sua formação, disciplinas e disponibilidade.">
                    <CardContent className="grid gap-6">
                         <div className="grid gap-2">
                            <Label className="flex items-center gap-2"><Briefcase className="h-5 w-5"/> Formação Acadêmica</Label>
                            {education.map((edu, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={edu}
                                        onChange={(e) => handleEducationChange(index, e.target.value)}
                                        disabled={!isEditing}
                                        placeholder="Ex: Mestrado em Física Aplicada - USP"
                                    />
                                    {isEditing && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveEducation(index)}
                                            className="text-destructive hover:text-destructive"
                                            disabled={education.length <= 1 && edu === ''}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                             {isEditing && (
                                <Button variant="outline" size="sm" onClick={handleAddEducation} className="mt-2 w-fit">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar Formação
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4">
                            <Label className="flex items-center gap-2"><Layers className="h-5 w-5"/> Disciplinas que Leciona</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-md border p-4">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`subject-${subject.id}`}
                                            checked={selectedSubjects.includes(subject.id)}
                                            onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                                            disabled={!isEditing}
                                        />
                                        <label
                                            htmlFor={`subject-${subject.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {subject.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleCard>

                <CollapsibleCard title="Integrações" description="Conecte suas ferramentas de produtividade.">
                     <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <NotionIcon />
                                <div>
                                    <p className="font-semibold">Notion</p>
                                    <p className="text-sm text-muted-foreground">Sincronize suas anotações de aula.</p>
                                </div>
                            </div>
                            <Button variant="outline">Conectar</Button>
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <TrelloIcon />
                                <div>
                                    <p className="font-semibold">Trello</p>
                                    <p className="text-sm text-muted-foreground">Gerencie o plano de estudos dos alunos.</p>
                                </div>
                            </div>
                            <Button variant="outline">Conectar</Button>
                        </div>
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <Webhook className="h-6 w-6"/>
                                <div>
                                    <p className="font-semibold">Webhooks</p>
                                    <p className="text-sm text-muted-foreground">Crie automações personalizadas.</p>
                                </div>
                            </div>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Button variant="outline" disabled>Em Breve</Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>A integração com webhooks estará disponível em breve.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                     </CardContent>
                </CollapsibleCard>
            </>
        )}
      </div>
    </div>
  );
}

// Wrap the component in a Suspense boundary if you are using server-side rendering
// and need to wait for the search params.
import { Suspense } from 'react';

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ProfilePageComponent />
        </Suspense>
    )
}

    