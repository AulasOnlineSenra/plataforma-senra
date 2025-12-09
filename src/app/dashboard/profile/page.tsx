

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { getMockUser, teachers as initialTeachers, subjects, allUsers as initialAllUsers, users as initialRegularUsers } from '@/lib/data';
import { UserRole, Teacher, User, EducationEntry, EducationType, Availability } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Webhook,
  Briefcase,
  User as UserIcon,
  BookUser,
  Pencil,
  MinusCircle,
  CalendarDays,
  Shield,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { EditableInput } from '@/components/editable-input';
import { EditableTextarea } from '@/components/editable-textarea';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Link from 'next/link';


const TEACHERS_STORAGE_KEY = 'teacherList';
const USERS_STORAGE_KEY = 'userList';


const CollapsibleCard = ({
    title,
    description,
    icon,
    children,
    isOpen,
    onOpenChange,
} : {
    title: string,
    description: string,
    icon: React.ElementType,
    children: React.ReactNode,
    isOpen: boolean,
    onOpenChange: (isOpen: boolean) => void;
}) => {
    const Icon = icon;
    
    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <Card>
                <CollapsibleTrigger asChild>
                    <div className="w-full flex flex-row items-start justify-between cursor-pointer hover:bg-accent/50 rounded-t-lg p-6">
                        <div className="flex items-center gap-4 text-left">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                            <div className="grid gap-1">
                                <CardTitle>{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </div>
                        </div>
                        <div className='shrink-0 p-2'>
                            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            <span className="sr-only">{isOpen ? "Recolher" : "Expandir"}</span>
                        </div>
                    </div>
                </CollapsibleTrigger>
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
    <svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M1.75,2.75H13a.75.75,0,0,1,.75.75V15.19l-3.32-3.32a.75.75,0,0,0-1.06,1.06l4.5,4.5a.75.75,0,0,0,1.06,0l4.5-4.5a.75.75,0,0,0-1.06-1.06L14.5,15.19V3.5a2.25,2.25,0,0,0-2.25-2.25H1.75a.75.75,0,0,0-.75.75v18.5a.75.75,0,0,0,.75.75h11.5a.75.75,0,0,0,0-1.5H2.5v-17Z" />
    </svg>
);

const GoogleMeetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="#00832D" d="M13 10.5h8.5v3H13z"/>
        <path fill="#0066DA" d="M12.5 1.875A3.375 3.375 0 009.125 5.25V11h6.75V5.25A3.375 3.375 0 0012.5 1.875z"/>
        <path fill="#E94235" d="M9.125 11v7.875a3.375 3.375 0 106.75 0V11"/>
        <path fill="#2684FC" d="M1 11h8.125v8.875a3.375 3.375 0 11-6.75 0V11H1z"/>
        <path fill="#FFBA00" d="M21.5 1.875A3.375 3.375 0 0018.125 5.25V11H23V5.25A3.375 3.375 0 0021.5 1.875z"/>
    </svg>
);


function ProfilePageComponent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const userIdParam = searchParams.get('userId');

    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>(initialAllUsers);
    const [profileUser, setProfileUser] = useState<User | Teacher | null>(null);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>('personal');


    const updateAllUsers = useCallback(() => {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
        const users = storedUsers ? JSON.parse(storedUsers) : initialRegularUsers;
        const teachers = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
        setAllUsers([...users, ...teachers]);
    }, []);

    useEffect(() => {
        updateAllUsers();
        window.addEventListener('storage', updateAllUsers);
        return () => window.removeEventListener('storage', updateAllUsers);
    }, [updateAllUsers]);


    useEffect(() => {
        const loggedInUserStr = localStorage.getItem('currentUser');
        if (loggedInUserStr) {
            setLoggedInUser(JSON.parse(loggedInUserStr));
        } else {
            setLoggedInUser(getMockUser('student'));
        }
    }, []);
    
    useEffect(() => {
        const targetId = userIdParam || loggedInUser?.id;
        if (targetId) {
            const userToView = allUsers.find(u => u.id === targetId);
            setProfileUser(userToView || null);
        } else {
            setProfileUser(loggedInUser);
        }
    }, [userIdParam, loggedInUser, allUsers]);


    const canEdit = loggedInUser?.role === 'admin' || profileUser?.id === loggedInUser?.id;

    const handleSave = (field: keyof (User | Teacher), value: any) => {
        if (!profileUser) return;
        
        const updatedUser = { ...profileUser, [field]: value };
        setProfileUser(updatedUser);
        
        let storageKey: string;
        let currentList: (User | Teacher)[];

        if(updatedUser.role === 'teacher') {
            storageKey = TEACHERS_STORAGE_KEY;
            const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
            currentList = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
        } else {
            storageKey = USERS_STORAGE_KEY;
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            currentList = storedUsers ? JSON.parse(storedUsers) : initialRegularUsers;
        }
        
        const updatedList = currentList.map(u => u.id === updatedUser.id ? updatedUser : u);
        
        localStorage.setItem(storageKey, JSON.stringify(updatedList));

        if(loggedInUser?.id === updatedUser.id) {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Perfil Atualizado!',
            description: `O campo foi salvo com sucesso.`,
        });
    };
    
     const handleSaveEducation = (updatedEntries: EducationEntry[]) => {
        handleSave('education', updatedEntries);
     }
     
     const handleSaveAddress = (field: string, value: string) => {
        if (!profileUser) return;
        const currentAddress = profileUser.address || {};
        const updatedAddress = { ...currentAddress, [field]: value };
        handleSave('address', updatedAddress);
    };
    
     const handleChangePassword = () => {
        if (!profileUser || !profileUser.email) return;

        // In a real app, this verification would happen on the server side.
        const savedPassword = localStorage.getItem(`savedPassword-${profileUser.email}`);
        
        // This allows 'password' as a default password or if no password is set
        if (savedPassword && savedPassword !== currentPassword && currentPassword !== 'password') {
             toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'A senha atual está incorreta.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'As senhas não coincidem.',
            });
            return;
        }
        if (newPassword.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Senha muito curta',
                description: 'A nova senha deve ter pelo menos 6 caracteres.',
            });
            return;
        }

        localStorage.setItem(`savedPassword-${profileUser.email}`, newPassword);

        toast({
            title: 'Senha Alterada!',
            description: 'Sua senha foi atualizada com sucesso e será usada no próximo login.',
        });

        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
    };

    const handleCepSave = async (cep: string) => {
        if (!profileUser) return;
    
        const cepOnlyNumbers = cep.replace(/\D/g, '');
        let updatedAddress = { ...(profileUser.address || {}), zipCode: cep };
    
        if (cepOnlyNumbers.length !== 8) {
            handleSave('address', updatedAddress);
            return;
        }
    
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepOnlyNumbers}/json/`);
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            
            if (data.erro) {
                toast({
                    variant: "destructive",
                    title: "CEP não encontrado",
                    description: "Por favor, verifique o CEP e tente novamente.",
                });
                handleSave('address', { ...updatedAddress });
                return;
            }
    
            updatedAddress = {
                ...updatedAddress,
                state: data.uf || '',
                neighborhood: data.bairro || '',
                street: data.logradouro || '',
            };
    
            handleSave('address', updatedAddress);
    
            toast({
                title: 'Endereço Preenchido!',
                description: 'Os dados do endereço foram preenchidos automaticamente.',
            });
    
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar CEP",
                description: "Não foi possível buscar as informações do endereço. Tente novamente mais tarde.",
            });
            handleSave('address', { ...updatedAddress });
            console.error("Failed to fetch CEP:", error);
        }
    };
    
    const handleOpenPasswordDialog = () => {
        if (profileUser) {
            const savedPassword = localStorage.getItem(`savedPassword-${profileUser.email}`) || 'password';
            setCurrentPassword(savedPassword);
            setShowCurrentPassword(false);
        }
        setIsPasswordDialogOpen(true);
    };

    if (!profileUser) {
        return <div>Carregando perfil...</div>;
    }
    
    const isTeacher = profileUser.role === 'teacher';
    const teacherProfile = isTeacher ? profileUser as Teacher : null;
    
    const pageTitle = userIdParam && profileUser ? `Perfil de ${profileUser.name}` : 'Meu Perfil';

    const handleSubjectsChange = (subjectId: string, checked: boolean) => {
        if (!teacherProfile) return;
        
        const currentSubjects = teacherProfile.subjects || [];
        let updatedSubjects: string[];

        if (checked) {
            updatedSubjects = [...currentSubjects, subjectId];
        } else {
            updatedSubjects = currentSubjects.filter(id => id !== subjectId);
        }
        
        handleSave('subjects', updatedSubjects);
    }
    
    const handleAvailabilityChange = (newAvailability: Availability) => {
        if (!teacherProfile) return;
        handleSave('availability', newAvailability);
    }
    
    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrador',
      student: 'Aluno',
      teacher: 'Professor',
    };

    const handleAccordionToggle = (value: string) => {
        setOpenAccordion(openAccordion === value ? null : value);
    };

    const getBreadcrumbPath = () => {
      if (!userIdParam || !profileUser) return null;
      switch (profileUser.role) {
        case 'teacher':
          return { name: 'Professores', path: '/dashboard/teachers' };
        case 'student':
          return { name: 'Alunos', path: '/dashboard/students' };
        case 'admin':
          return { name: 'Administradores', path: '/dashboard/admin/settings' };
        default:
          return null;
      }
    }
    const breadcrumbPath = getBreadcrumbPath();


    return (
      <>
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            {breadcrumbPath && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href={breadcrumbPath.path} className="hover:underline">
                        {breadcrumbPath.name}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-foreground">{profileUser.name}</span>
                </div>
            )}
            <div className="flex items-center">
                <h1 className="font-headline text-2xl md:text-3xl font-bold">{pageTitle}</h1>
            </div>
            
            <div className="grid gap-6">
                <CollapsibleCard 
                    title="Informações Pessoais" 
                    description="Seus dados de perfil, contato e endereço." 
                    icon={UserIcon} 
                    isOpen={openAccordion === 'personal'}
                    onOpenChange={() => handleAccordionToggle('personal')}
                >
                    <CardHeader>
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <ProfileAvatarUploader user={profileUser} onSave={(url) => handleSave('avatarUrl', url)} canEdit={canEdit} />
                                <div className="text-center md:text-left">
                                    <CardTitle className="text-2xl font-headline">{profileUser.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 justify-center md:justify-start">
                                        <Badge variant="secondary">{roleLabels[profileUser.role]}</Badge> • Entrou em 2023
                                    </CardDescription>
                                </div>
                            </div>
                            <EditableTextarea
                                label="Biografia"
                                value={profileUser.bio || ''}
                                onSave={(value) => handleSave('bio', value)}
                                placeholder="Conte um pouco sobre você..."
                                canEdit={canEdit}
                                className="h-full"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 border-t pt-6">
                        <EditableInput label="Nome Completo" value={profileUser.name} onSave={(v) => handleSave('name', v)} canEdit={canEdit} />
                        <EditableInput label="Apelido" value={profileUser.nickname || ''} placeholder="Como prefere ser chamado(a)?" onSave={(v) => handleSave('nickname', v)} canEdit={canEdit} />
                        <EditableInput label="Email" value={profileUser.email} onSave={(v) => handleSave('email', v)} canEdit={canEdit} type="email" />
                        <EditableInput label="Telefone" value={profileUser.phone || ''} placeholder="(00) 00000-0000" onSave={(v) => handleSave('phone', v)} canEdit={canEdit} type="tel" />
                        <EditableInput label="CPF" value={profileUser.cpf || ''} placeholder="000.000.000-00" onSave={(v) => handleSave('cpf', v)} canEdit={canEdit} />
                        <EditableInput label="Data de Nascimento" value={profileUser.birthDate || ''} onSave={(v) => handleSave('birthDate', v)} canEdit={canEdit} type="date"/>
                    </CardContent>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 border-t pt-6">
                        <EditableInput label="CEP" value={profileUser.address?.zipCode || ''} placeholder="00000-000" onSave={(v) => handleCepSave(v)} canEdit={canEdit} />
                        <EditableInput label="Estado" value={profileUser.address?.state || ''} placeholder="Ex: SP" onSave={(v) => handleSaveAddress('state', v)} canEdit={canEdit} />
                        <EditableInput label="Bairro" value={profileUser.address?.neighborhood || ''} placeholder="Ex: Centro" onSave={(v) => handleSaveAddress('neighborhood', v)} canEdit={canEdit} />
                        <EditableInput label="Rua" value={profileUser.address?.street || ''} placeholder="Ex: Rua Principal" onSave={(v) => handleSaveAddress('street', v)} canEdit={canEdit} className="lg:col-span-2" />
                        <EditableInput label="Número" value={profileUser.address?.number || ''} placeholder="Ex: 123" onSave={(v) => handleSaveAddress('number', v)} canEdit={canEdit} />
                    </CardContent>
                </CollapsibleCard>

                 <CollapsibleCard 
                    title="Segurança" 
                    description="Altere sua senha e gerencie a segurança da sua conta." 
                    icon={Shield}
                    isOpen={openAccordion === 'security'}
                    onOpenChange={() => handleAccordionToggle('security')}
                 >
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label>Senha</Label>
                                <p className="text-muted-foreground">••••••••</p>
                            </div>
                            {canEdit && (
                                <Button variant="outline" onClick={handleOpenPasswordDialog}>
                                    Alterar Senha
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleCard>

                {isTeacher && teacherProfile && (
                     <>
                         <CollapsibleCard 
                            title="Sala de Aula Virtual" 
                            description="Configure o link permanente para suas aulas." 
                            icon={GoogleMeetIcon}
                            isOpen={openAccordion === 'meet'}
                            onOpenChange={() => handleAccordionToggle('meet')}
                         >
                           <CardContent className="grid gap-6 pt-6">
                                <EditableInput 
                                    label="Link do Google Meet" 
                                    value={teacherProfile.googleMeetLink || ''} 
                                    placeholder="https://meet.google.com/sua-sala" 
                                    onSave={(v) => handleSave('googleMeetLink', v)} 
                                    canEdit={canEdit} 
                                />
                            </CardContent>
                        </CollapsibleCard>
                        <CollapsibleCard 
                            title="Disciplinas Lecionadas" 
                            description="Quais disciplinas você está apto(a) a lecionar." 
                            icon={Briefcase}
                            isOpen={openAccordion === 'subjects'}
                            onOpenChange={() => handleAccordionToggle('subjects')}
                        >
                           <CardContent className="grid gap-6 pt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`subj-${subject.id}`}
                                            checked={teacherProfile.subjects?.includes(subject.id)}
                                            onCheckedChange={(checked) => handleSubjectsChange(subject.id, !!checked)}
                                            disabled={!canEdit}
                                        />
                                        <label
                                            htmlFor={`subj-${subject.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {subject.name}
                                        </label>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </CollapsibleCard>
                         <CollapsibleCard 
                            title="Disponibilidade Semanal" 
                            description="Seus horários disponíveis para aulas." 
                            icon={CalendarDays}
                            isOpen={openAccordion === 'availability'}
                            onOpenChange={() => handleAccordionToggle('availability')}
                         >
                             <CardContent className="grid gap-6 pt-6">
                                { teacherProfile &&
                                    <AvailabilityManager
                                        availability={teacherProfile.availability || {}}
                                        onSave={handleAvailabilityChange}
                                        canEdit={canEdit}
                                    />
                                }
                            </CardContent>
                        </CollapsibleCard>
                    </>
                )}

                {profileUser.role !== 'student' && (
                    <CollapsibleCard 
                        title="Formação Acadêmica" 
                        description="Seu histórico educacional e qualificações." 
                        icon={BookUser}
                        isOpen={openAccordion === 'education'}
                        onOpenChange={() => handleAccordionToggle('education')}
                    >
                        <EducationManager
                            initialEntries={profileUser.education || []}
                            onSave={handleSaveEducation}
                            canEdit={canEdit}
                        />
                    </CollapsibleCard>
                )}
                
                <CollapsibleCard 
                    title="Integrações" 
                    description="Conecte seu perfil com outras ferramentas." 
                    icon={Webhook}
                    isOpen={openAccordion === 'integrations'}
                    onOpenChange={() => handleAccordionToggle('integrations')}
                >
                    <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <TrelloIcon />
                                   <CardTitle className="text-lg">Trello</CardTitle>
                               </div>
                                <Switch disabled={!canEdit} />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Sincronize suas aulas e tarefas com seus quadros do Trello.</p>
                            </CardContent>
                        </Card>
                        <Card>
                           <CardHeader className="flex flex-row items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <NotionIcon />
                                   <CardTitle className="text-lg">Notion</CardTitle>
                               </div>
                                <Switch disabled={!canEdit} />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Exporte históricos de aulas e anotações para suas páginas do Notion.</p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </CollapsibleCard>
            </div>
        </div>
        <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
            if (!open) {
                // Reset states when closing
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPassword(false);
                setShowCurrentPassword(false);
            }
            setIsPasswordDialogOpen(open);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                        Para sua segurança, digite sua senha atual antes de definir uma nova.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pr-10"
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                {showCurrentPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                <span className="sr-only">{showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pr-10"
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => setShowPassword(!showPassword)}
                                >
                                {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                         <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => setShowPassword(!showPassword)}
                                >
                                {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleChangePassword}>
                        Salvar Nova Senha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}


function EducationManager({ initialEntries, onSave, canEdit }: { initialEntries: EducationEntry[], onSave: (entries: EducationEntry[]) => void, canEdit: boolean }) {
    const [entries, setEntries] = useState(initialEntries);

    const handleUpdate = (index: number, field: keyof EducationEntry, value: string) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };
    
    const handleAddNew = () => {
        setEntries([...entries, { id: `edu-${Date.now()}`, course: '', university: '', type: 'Bacharelado', conclusionYear: '' }]);
    };
    
    const handleRemove = (id: string) => {
        setEntries(entries.filter(entry => entry.id !== id));
    };

    const handleSaveChanges = () => {
        onSave(entries);
    }
    
    const educationTypes: EducationType[] = ['Licenciatura', 'Bacharelado', 'Mestrado', 'Doutorado', 'Pós-graduação'];

    return (
        <CardContent className="grid gap-6 pt-6">
            {entries.map((entry, index) => (
                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg relative">
                    {canEdit && (
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => handleRemove(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="grid gap-2">
                        <Label>Curso</Label>
                        <Input value={entry.course} onChange={e => handleUpdate(index, 'course', e.target.value)} disabled={!canEdit} placeholder="Ex: Engenharia da Computação"/>
                    </div>
                     <div className="grid gap-2">
                        <Label>Instituição</Label>
                        <Input value={entry.university} onChange={e => handleUpdate(index, 'university', e.target.value)} disabled={!canEdit} placeholder="Ex: USP"/>
                    </div>
                     <div className="grid gap-2">
                        <Label>Tipo</Label>
                        <Select value={entry.type} onValueChange={(value) => handleUpdate(index, 'type', value)} disabled={!canEdit}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {educationTypes.map(type => (
                                   <SelectItem key={type} value={type}>{type}</SelectItem>
                               ))}
                           </SelectContent>
                       </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label>Ano de Conclusão</Label>
                        <Input value={entry.conclusionYear} onChange={e => handleUpdate(index, 'conclusionYear', e.target.value)} disabled={!canEdit} placeholder="Ex: 2025"/>
                    </div>
                </div>
            ))}
             {canEdit && (
                 <div className="flex justify-between items-center mt-4">
                     <Button variant="outline" onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4"/> Adicionar Formação
                    </Button>
                     <Button onClick={handleSaveChanges} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Salvar Alterações na Formação</Button>
                </div>
            )}
        </CardContent>
    );
}

const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

type TimeRange = { start: string; end: string };

function AvailabilityDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialRanges,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ranges: TimeRange[], applyToAll: boolean) => void;
  initialRanges: TimeRange[];
}) {
  const [ranges, setRanges] = useState<TimeRange[]>([]);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    // Only reset ranges when the dialog opens with new initialRanges
    if (isOpen) {
        setRanges(initialRanges.length > 0 ? initialRanges : [{ start: '09:00', end: '17:00' }]);
    }
  }, [isOpen, initialRanges]);

  const handleAddRange = () => {
    setRanges([...ranges, { start: '09:00', end: '17:00' }]);
  };

  const handleRemoveRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, type: 'start' | 'end', value: string) => {
    const newRanges = [...ranges];
    newRanges[index][type] = value;
    setRanges(newRanges);
  };

  const handleSaveClick = () => {
    onSave(ranges, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) setApplyToAll(false); // Reset checkbox on close
        onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Disponibilidade</DialogTitle>
          <DialogDescription>
            Adicione ou remova os intervalos de tempo em que você está disponível.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {ranges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select value={range.start} onValueChange={(v) => handleTimeChange(index, 'start', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <span>-</span>
              <Select value={range.end} onValueChange={(v) => handleTimeChange(index, 'end', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveRange(index)}>
                <MinusCircle className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddRange}>
            <Plus className="mr-2" /> Adicionar Intervalo
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="apply-to-all" checked={applyToAll} onCheckedChange={(checked) => setApplyToAll(!!checked)} />
          <Label htmlFor="apply-to-all">Aplicar para todos os dias</Label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveClick}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityManager({ availability, onSave, canEdit }: { availability: Availability, onSave: (newAvailability: Availability) => void, canEdit: boolean }) {
    const [currentAvailability, setCurrentAvailability] = useState(availability);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<string | null>(null);
    
    useEffect(() => {
        setCurrentAvailability(availability);
    }, [availability]);

    const daysOfWeek = {
        monday: 'Segunda-Feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
        sunday: 'Domingo',
    };

    const handleEditClick = (dayKey: string) => {
        setEditingDay(dayKey);
        setIsDialogOpen(true);
    };

    const handleRemoveDay = (dayKey: string) => {
        const newAvailability = { ...currentAvailability };
        delete (newAvailability as any)[dayKey];
        setCurrentAvailability(newAvailability);
        onSave(newAvailability);
    }
    
    const handleSaveDialog = (ranges: TimeRange[], applyToAll: boolean) => {
        if (!editingDay) return;

        let newAvailability = { ...currentAvailability };
        
        if (applyToAll) {
            Object.keys(daysOfWeek).forEach(day => {
                newAvailability[day] = ranges;
            });
        } else {
            newAvailability[editingDay] = ranges;
        }

        setCurrentAvailability(newAvailability);
        onSave(newAvailability);
        setEditingDay(null);
    };

    const getDayRanges = (dayKey: string): TimeRange[] => {
        return currentAvailability[dayKey] || [];
    }

    return (
        <div className="space-y-2">
            {Object.entries(daysOfWeek).map(([dayKey, dayName]) => (
                <div key={dayKey} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex flex-col">
                        <span className="font-semibold">{dayName}</span>
                        <span className="text-sm text-muted-foreground">
                            {getDayRanges(dayKey).length > 0
                                ? getDayRanges(dayKey).map(r => `${r.start} - ${r.end}`).join(', ')
                                : 'Indisponível'}
                        </span>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(dayKey)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                             {getDayRanges(dayKey).length > 0 && 
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveDay(dayKey)}>
                                    <MinusCircle className="h-4 w-4 text-destructive" />
                                </Button>
                             }
                        </div>
                    )}
                </div>
            ))}
            {editingDay && (
                <AvailabilityDialog 
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    initialRanges={getDayRanges(editingDay)}
                    onSave={handleSaveDialog}
                />
            )}
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
