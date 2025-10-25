
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
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
import { UserRole, Teacher, User } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Webhook,
  Briefcase,
  User as UserIcon,
  BookUser,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { EditableInput } from '@/components/editable-input';
import { EditableTextarea } from '@/components/editable-textarea';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';


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
    <path d="M22.5 3.375a.375.375 0 0 0-.375.375v16.5a.375.375 0 0 0 .375.375h.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-.75zM19.5 3.375A.375.375 0 0 0 19.125 3h-3.75a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375zM.375 3.375h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375H.375a.375.375 0 0 1-.375-.375V3.75A.375.375 0 0 1 .375 3.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-3.75a.375.375 0 0 0-.375-.375v16.875a.375.375 0 0 0 .375.375h.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-.75a.375.375 0 0 0-.375.375z" />
  </svg>
);


function ProfilePageComponent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userToDisplay, setUserToDisplay] = useState<User | Teacher | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const { toast } = useToast();

  const updateUserState = useCallback((id: string, updatedData: Partial<User | Teacher>) => {
      const isTeacher = 'subjects' in updatedData || userToDisplay?.role === 'teacher';
      const storageKey = isTeacher ? TEACHERS_STORAGE_KEY : USERS_STORAGE_KEY;
      const initialData = isTeacher ? initialTeachers : initialAllUsers;

      const storedData = localStorage.getItem(storageKey);
      let currentData = storedData ? JSON.parse(storedData) : initialData;
      
      const userIndex = currentData.findIndex((u: User) => u.id === id);

      if (userIndex !== -1) {
          currentData[userIndex] = { ...currentData[userIndex], ...updatedData };
          localStorage.setItem(storageKey, JSON.stringify(currentData));
          
          setUserToDisplay(prev => prev ? { ...prev, ...updatedData } : null);
          window.dispatchEvent(new Event('storage')); // Notify other components like sidebar
      }
  }, [userToDisplay]);


  useEffect(() => {
    // Determine the logged-in user
    const loggedInUserStr = localStorage.getItem('currentUser');
    const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : getMockUser('student');
    setCurrentUser(loggedInUser);

    let targetUser: User | Teacher | undefined;
    
    // Admin is viewing a specific profile
    if (userId && loggedInUser.role === 'admin') {
      const allUsers = [...JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || JSON.stringify(initialAllUsers)), ...JSON.parse(localStorage.getItem(TEACHERS_STORAGE_KEY) || JSON.stringify(initialTeachers))];
      targetUser = allUsers.find(u => u.id === userId);
      setCanEdit(true);
    } else { // User is viewing their own profile
      targetUser = loggedInUser;
      setCanEdit(true);
    }

    if (targetUser) {
        // Ensure education is an array
        if (typeof targetUser.education === 'string') {
            targetUser.education = [targetUser.education];
        } else if (!targetUser.education) {
            targetUser.education = [];
        }
        setUserToDisplay(targetUser);
    }

  }, [userId]);


  if (!userToDisplay) {
    return <div>Carregando perfil...</div>;
  }
  
  const handleFieldSave = (field: keyof (User & Teacher), value: any) => {
    if (userToDisplay) {
        const updatedUser = { ...userToDisplay, [field]: value };
        updateUserState(userToDisplay.id, updatedUser);
        toast({ title: "Perfil Atualizado", description: `Seu ${field} foi salvo.` });
    }
  };

  const handleAddressSave = (field: keyof NonNullable<User['address']>, value: string) => {
    if (userToDisplay) {
        const newAddress = { ...(userToDisplay.address || {}), [field]: value };
        handleFieldSave('address', newAddress);
    }
  };

  const handleEducationChange = (index: number, value: string) => {
    if (userToDisplay?.education) {
      const newEducation = [...userToDisplay.education];
      newEducation[index] = value;
      handleFieldSave('education', newEducation);
    }
  };
  
  const handleAddEducation = () => {
    if (userToDisplay?.education) {
      const newEducation = [...userToDisplay.education, ''];
      handleFieldSave('education', newEducation);
    }
  };
  
  const handleRemoveEducation = (index: number) => {
    if (userToDisplay?.education) {
      const newEducation = userToDisplay.education.filter((_, i) => i !== index);
      handleFieldSave('education', newEducation);
    }
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if (userToDisplay?.role === 'teacher') {
        const teacher = userToDisplay as Teacher;
        const currentSubjects = teacher.subjects || [];
        const newSubjects = checked
            ? [...currentSubjects, subjectId]
            : currentSubjects.filter(id => id !== subjectId);
        handleFieldSave('subjects', newSubjects);
    }
  };


  const memberSince = userToDisplay.id.includes('user-')
    ? new Date(parseInt(userToDisplay.id.split('-')[1])).toLocaleDateString('pt-BR')
    : 'Data não disponível';

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <ProfileAvatarUploader user={userToDisplay} onSave={(avatarUrl) => handleFieldSave('avatarUrl', avatarUrl)} canEdit={canEdit} />
        <div className="grid gap-1 flex-1">
            <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Perfil de {userToDisplay.name}
            </h1>
        </div>
      </div>
      <div className="grid gap-6">

        <CollapsibleCard title="Informações Pessoais" description="Edite seus dados pessoais e de contato." icon={UserIcon} defaultOpen={true}>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableInput label="Nome Completo" value={userToDisplay.name} onSave={(value) => handleFieldSave('name', value)} canEdit={canEdit} />
                <EditableInput label="Apelido (opcional)" value={userToDisplay.nickname || ''} onSave={(value) => handleFieldSave('nickname', value)} placeholder="Como você gosta de ser chamado" canEdit={canEdit} />
                <EditableInput label="Email" value={userToDisplay.email} onSave={(value) => handleFieldSave('email', value)} type="email" canEdit={canEdit} />
                <EditableInput label="Telefone" value={userToDisplay.phone || ''} onSave={(value) => handleFieldSave('phone', value)} placeholder="(XX) XXXXX-XXXX" canEdit={canEdit} />
                <div className="grid gap-2">
                    <Label>Membro Desde</Label>
                    <Input value={memberSince} disabled />
                </div>
                 <EditableInput label="CPF" value={userToDisplay.cpf || ''} onSave={(value) => handleFieldSave('cpf', value)} placeholder="000.000.000-00" canEdit={canEdit} />
                <EditableInput label="Data de Nascimento" value={userToDisplay.birthDate || ''} onSave={(value) => handleFieldSave('birthDate', value)} type="date" canEdit={canEdit} />
                <EditableInput label="CEP" value={userToDisplay.address?.zipCode || ''} onSave={(value) => handleAddressSave('zipCode', value)} placeholder="00000-000" canEdit={canEdit} />
                <EditableInput label="Estado" value={userToDisplay.address?.state || ''} onSave={(value) => handleAddressSave('state', value)} placeholder="Ex: SP" canEdit={canEdit} />
                <EditableInput label="Bairro" value={userToDisplay.address?.neighborhood || ''} onSave={(value) => handleAddressSave('neighborhood', value)} placeholder="Ex: Centro" canEdit={canEdit} />
                <EditableTextarea label="Sua Bio" value={userToDisplay.bio || ''} onSave={(value) => handleFieldSave('bio', value)} placeholder="Fale um pouco sobre você..." canEdit={canEdit} className="md:col-span-2 lg:col-span-3"/>
            </CardContent>
        </CollapsibleCard>
        
        {userToDisplay.role === 'teacher' && (
          <>
            <CollapsibleCard title="Formação Acadêmica" description="Liste suas qualificações e diplomas." icon={BookUser}>
              <CardContent className="grid gap-4">
                  {(userToDisplay.education || []).map((edu, index) => (
                      <div key={index} className="flex items-center gap-2">
                          <Input
                              value={edu}
                              onChange={(e) => handleEducationChange(index, e.target.value)}
                              placeholder="Ex: Mestrado em Física Aplicada - USP"
                              disabled={!canEdit}
                          />
                           {canEdit && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveEducation(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                  ))}
                  {canEdit && (
                      <Button variant="outline" onClick={handleAddEducation}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Formação
                      </Button>
                  )}
              </CardContent>
            </CollapsibleCard>

            <CollapsibleCard title="Perfil de Professor" description="Detalhes sobre suas disciplinas e disponibilidade." icon={Briefcase}>
                <CardContent className="grid gap-6">
                     <div className="grid gap-4">
                        <Label className="font-bold">Disciplinas que Leciona</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`subject-${subject.id}`}
                                checked={(userToDisplay as Teacher).subjects?.includes(subject.id)}
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
          </>
        )}

        <CollapsibleCard title="Integrações" description="Conecte suas ferramentas de produtividade." icon={Webhook}>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <TrelloIcon />
                        <Switch disabled={!canEdit} />
                    </CardHeader>
                    <CardContent>
                        <CardTitle className="text-lg">Trello</CardTitle>
                        <CardDescription>Sincronize suas aulas e tarefas com o Trello.</CardDescription>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <NotionIcon />
                        <Switch disabled={!canEdit} />
                    </CardHeader>
                    <CardContent>
                        <CardTitle className="text-lg">Notion</CardTitle>
                        <CardDescription>Exporte anotações e cronogramas para o Notion.</CardDescription>
                    </CardContent>
                </Card>
            </CardContent>
        </CollapsibleCard>
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

    