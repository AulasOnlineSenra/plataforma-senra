
'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Label } from '@/components/ui/label';
import { getMockUser, teachers as initialTeachers, subjects, allUsers as initialAllUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole, Teacher, User } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Webhook,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { EditableInput } from '@/components/editable-input';
import { EditableTextarea } from '@/components/editable-textarea';


const TEACHERS_STORAGE_KEY = 'teacherList';
const USERS_STORAGE_KEY = 'userList';


const CollapsibleCard = ({
    title,
    description,
    icon,
    children,
    defaultOpen = false,
} : {
    title: string,
    description: string,
    icon: React.ElementType,
    children: React.ReactNode,
    defaultOpen?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Icon = icon;
    
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        <div className="grid gap-1">
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
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
    <path d="M22.5 3.375a.375.375 0 0 0-.375.375v16.5a.375.375 0 0 0 .375.375h.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-.75zM19.5 3.375A.375.375 0 0 0 19.125 3h-3.75a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375zM.375 3.375h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375H.375a.375.375 0 0 1-.375-.375V3.75A.375.375 0 0 1 .375 3.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-3.75z" />
  </svg>
);

function ProfilePageComponent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | Teacher | null>(null);
  const [education, setEducation] = useState<string[]>(['']);

  useEffect(() => {
    // Determine the logged-in user
    const role = localStorage.getItem('userRole') as UserRole | null;
    let currentUser: User | Teacher | null = null;
    const storedUser = localStorage.getItem('currentUser');
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
      if (Array.isArray(userToDisplay.education)) {
        setEducation(userToDisplay.education.length > 0 ? userToDisplay.education : ['']);
      } else if (typeof userToDisplay.education === 'string' && userToDisplay.education) {
        setEducation([userToDisplay.education]);
      } else {
        setEducation(['']);
      }
    }
  }, [userId]);

  const handleSaveField = (field: string, value: any) => {
    if (!profileUser) return;
    
    // This function handles saving a single field.
    // It creates a nested object if the field name contains a dot.
    const keys = field.split('.');
    let updatedValue: Record<string, any> = { [keys.pop()!]: value };
    for (let i = keys.length - 1; i >= 0; i--) {
        updatedValue = { [keys[i]]: updatedValue };
    }

    // Merge the updated field into the user object
    const updatedUser = {
        ...profileUser,
        ...updatedValue,
        address: { ...profileUser.address, ...(updatedValue.address || {}) },
    };

    updateUserInStorage(updatedUser);
  };
  
  const updateUserInStorage = (updatedUser: User | Teacher) => {
    setProfileUser(updatedUser);

    if (updatedUser.role === 'teacher') {
      const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
      const allTeachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
      const updatedTeacherList = allTeachers.map(t => t.id === updatedUser.id ? updatedUser : t);
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedTeacherList));
    } else {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
        const updatedUserList = allUsers.map(u => u.id === updatedUser.id ? updatedUser as User : u);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUserList));
    }
    
    if(loggedInUser?.id === updatedUser.id) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    window.dispatchEvent(new Event('storage'));

    toast({
      title: "Perfil Atualizado!",
      description: "Sua alteração foi salva.",
    });
  }

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if (!profileUser || profileUser.role !== 'teacher') return;

    const currentSubjects = (profileUser as Teacher).subjects || [];
    const newSubjects = checked 
        ? [...currentSubjects, subjectId] 
        : currentSubjects.filter(id => id !== subjectId);
    
    const updatedTeacher = { ...profileUser, subjects: newSubjects };
    updateUserInStorage(updatedTeacher as Teacher);
  }
  
  const handleEducationChange = (index: number, value: string) => {
    const newEducation = [...education];
    newEducation[index] = value;
    setEducation(newEducation);
  }
  
  const handleSaveEducation = (index: number, value: string) => {
    if (!profileUser) return;
    const newEducation = [...education];
    newEducation[index] = value;
    const finalEducation = newEducation.filter(edu => edu.trim() !== '');
    const updatedUser = { ...profileUser, education: finalEducation.length > 0 ? finalEducation : [''] };
    updateUserInStorage(updatedUser);
  }
  
  const handleAddEducation = () => {
    setEducation([...education, '']);
  }
  
  const handleRemoveEducation = (index: number) => {
    if (!profileUser) return;
    let newEducation: string[];
    if (education.length > 1) {
        newEducation = education.filter((_, i) => i !== index);
    } else {
        newEducation = ['']; // Clear the field but don't remove it
    }
    setEducation(newEducation);
    const updatedUser = { ...profileUser, education: newEducation };
    updateUserInStorage(updatedUser);
  }


  if (!profileUser) {
    return null; // or loading spinner
  }

  const canEdit = loggedInUser?.role === 'admin' || loggedInUser?.id === profileUser.id;
  const isTeacher = profileUser.role === 'teacher';
  
  const UserIcon = ({className}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Perfil de {profileUser.name.split(' ')[0]}
        </h1>
      </div>
      
      <div className="grid gap-6">
        <CollapsibleCard title="Informações Pessoais" description="Clique em um campo para editar seus dados pessoais e de contato." icon={UserIcon} defaultOpen={true}>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                <div className="flex flex-col items-center gap-4 sm:col-span-full">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileUser.avatarUrl} alt={profileUser.name} />
                      <AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <EditableTextarea
                        label="Sua Bio"
                        value={profileUser.bio || ''}
                        onSave={(value) => handleSaveField('bio', value)}
                        placeholder="Fale um pouco sobre você..."
                        canEdit={canEdit}
                        className="text-center"
                      />
                </div>
                 
                <EditableInput label="Nome Completo" value={profileUser.name} onSave={(value) => handleSaveField('name', value)} placeholder="Seu nome completo" canEdit={canEdit} />
                <EditableInput label="Apelido" value={profileUser.nickname || ''} onSave={(value) => handleSaveField('nickname', value)} placeholder="Como gosta de ser chamado(a)" canEdit={canEdit} />
                <EditableInput label="Email" value={profileUser.email} onSave={() => {}} placeholder="seu.email@exemplo.com" canEdit={false} type="email" />
                <EditableInput label="Telefone" value={profileUser.phone || ''} onSave={(value) => handleSaveField('phone', value)} placeholder="(XX) XXXXX-XXXX" canEdit={canEdit} />
                <EditableInput label="CPF" value={profileUser.cpf || ''} onSave={(value) => handleSaveField('cpf', value)} placeholder="000.000.000-00" canEdit={canEdit} />
                <EditableInput label="Data de Nascimento" value={profileUser.birthDate || ''} onSave={(value) => handleSaveField('birthDate', value)} canEdit={canEdit} type="date" />
                <EditableInput label="CEP" value={profileUser.address?.zipCode || ''} onSave={(value) => handleSaveField('address.zipCode', value)} placeholder="00000-000" canEdit={canEdit} />
                <EditableInput label="Estado" value={profileUser.address?.state || ''} onSave={(value) => handleSaveField('address.state', value)} placeholder="Ex: SP" canEdit={canEdit} />
                <EditableInput label="Bairro" value={profileUser.address?.neighborhood || ''} onSave={(value) => handleSaveField('address.neighborhood', value)} placeholder="Ex: Centro" canEdit={canEdit} />
            </CardContent>
        </CollapsibleCard>

        {isTeacher && (
            <>
              <CollapsibleCard title="Formação Acadêmica" description="Liste suas qualificações e diplomas." icon={Briefcase}>
                    <CardContent className="grid gap-4 pt-6">
                        {education.map((edu, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={edu}
                                    onChange={(e) => handleEducationChange(index, e.target.value)}
                                    onBlur={(e) => handleSaveEducation(index, e.target.value)}
                                    placeholder="Ex: Mestrado em Física Aplicada - USP"
                                    disabled={!canEdit}
                                />
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveEducation(index)}
                                        className="text-destructive hover:text-destructive"
                                        disabled={education.length === 1 && edu === ''}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {canEdit && (
                            <Button variant="outline" size="sm" onClick={handleAddEducation} className="mt-2 w-fit">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Formação
                            </Button>
                        )}
                    </CardContent>
              </CollapsibleCard>

              <CollapsibleCard title="Perfil de Professor" description="Detalhes sobre suas disciplinas e disponibilidade." icon={Layers}>
                    <CardContent className="pt-6">
                        <div className="grid gap-4">
                            <Label>Disciplinas que Leciona</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-md border p-4">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`subject-${subject.id}`}
                                            checked={(profileUser as Teacher).subjects?.includes(subject.id)}
                                            onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                                            disabled={!canEdit}
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

                <CollapsibleCard title="Integrações" description="Conecte suas ferramentas de produtividade." icon={Webhook}>
                     <CardContent className="grid gap-4 pt-6">
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

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ProfilePageComponent />
        </Suspense>
    )
}
