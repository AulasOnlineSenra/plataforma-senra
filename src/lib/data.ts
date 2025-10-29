

import type { User, Teacher, Subject, ClassPackage, ScheduleEvent, ChatContact, ChatMessage, UserRole, Suggestion, Referral, NavItem, EducationEntry, Availability } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  MessageSquare,
  WalletCards,
  KeyRound,
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  DollarSign,
  Package,
  Bot,
  Lightbulb,
  Gift,
  History,
} from 'lucide-react';


const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'João Aluno',
    email: 'joao.aluno@example.com',
    avatarUrl: findImage('user-avatar-1'),
    role: 'student',
    status: 'active',
    timezone: 'America/Sao_Paulo',
    nickname: 'João',
    phone: '(11) 91234-5678',
    education: [{ id: 'edu-1', course: 'Engenharia Civil', university: 'Mackenzie', type: 'Bacharelado', conclusionYear: '2025' }],
    bio: 'Estudante de engenharia buscando aprofundar meus conhecimentos em cálculo e física.',
    cpf: '123.456.789-00',
    birthDate: '1998-05-10',
    address: {
        zipCode: '01234-567',
        state: 'SP',
        neighborhood: 'Consolação',
        street: 'Rua da Consolação',
        number: '123'
    },
    lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    classCredits: 8,
    activePackage: 'Pacote de 12 aulas',
  },
  {
    id: 'admin-1',
    name: 'Admin Senra',
    email: 'admin@example.com',
    avatarUrl: findImage('user-avatar-2'),
    role: 'admin',
    timezone: 'America/Sao_Paulo',
    education: [{ id: 'edu-admin', course: 'Gerenciamento de Sistemas', university: 'Internet University', type: 'Bacharelado', conclusionYear: '2015' }],
    bio: 'Administrador da plataforma Aulas Online Senra.',
    lastAccess: new Date().toISOString(),
  },
  {
    id: 'user-2',
    name: 'Mariana Santos',
    email: 'mariana.santos@example.com',
    avatarUrl: 'https://picsum.photos/seed/student2/200/200',
    role: 'student',
    status: 'active',
    timezone: 'America/Manaus',
    referredByCode: 'ANA-5281',
    lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    classCredits: 4,
    activePackage: 'Pacote de 4 aulas',
  },
  {
    id: 'user-3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@example.com',
    avatarUrl: 'https://picsum.photos/seed/student3/200/200',
    role: 'student',
    status: 'inactive',
    timezone: 'America/Recife',
    lastAccess: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    classCredits: 0,
  },
  {
    id: 'user-4',
    name: 'Luisa Costa',
    email: 'luisa.costa@example.com',
    avatarUrl: 'https://picsum.photos/seed/student4/200/200',
    role: 'student',
    status: 'active',
    timezone: 'America/Fortaleza',
    referredByCode: 'ANA-5281',
    lastAccess: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    classCredits: 10,
    activePackage: 'Pacote de 12 aulas',
  },
];

export let teachers: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Ana Silva',
    nickname: 'Aninha',
    email: 'ana.silva@example.com',
    phone: '(11) 98765-4321',
    avatarUrl: findImage('teacher-photo-1'),
    role: 'teacher',
    subjects: ['subj-1', 'subj-3'],
    bio: 'Professora apaixonada por matemática e física, com 5 anos de experiência em aulas particulares.',
    education: [{ id: 'edu-t1', course: 'Física Aplicada', university: 'USP', type: 'Mestrado', conclusionYear: '2018' }],
    availability: {
        monday: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' },
        ],
        wednesday: [
            { start: '09:00', end: '12:00' },
        ],
    },
    timezone: 'America/Sao_Paulo',
    status: 'active',
    cpf: '987.654.321-11',
    birthDate: '1990-02-15',
     address: {
        zipCode: '22345-678',
        state: 'RJ',
        neighborhood: 'Copacabana',
        street: 'Avenida Atlântica',
        number: '456'
    },
    lastAccess: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'teacher-2',
    name: 'Carlos Lima',
    email: 'carlos.lima@example.com',
    avatarUrl: findImage('teacher-photo-2'),
    role: 'teacher',
    subjects: ['subj-2', 'subj-4'],
    bio: 'Especialista em literatura e redação, focado em preparar alunos para vestibulares e concursos.',
    education: [{ id: 'edu-t2', course: 'Letras', university: 'UFRJ', type: 'Doutorado', conclusionYear: '2015' }],
    availability: {},
    timezone: 'America/Sao_Paulo',
    status: 'active',
    lastAccess: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'teacher-3',
    name: 'Beatriz Costa',
    email: 'beatriz.costa@example.com',
    avatarUrl: findImage('teacher-photo-3'),
    role: 'teacher',
    subjects: ['subj-5'],
    bio: 'Historiadora e geógrafa, adora contar histórias sobre o mundo e suas transformações.',
    education: [{ id: 'edu-t3', course: 'História', university: 'UNICAMP', type: 'Licenciatura', conclusionYear: '2020' }],
    availability: {
        monday: [{ start: '18:00', end: '22:00' }],
        tuesday: [{ start: '18:00', end: '22:00' }],
        wednesday: [{ start: '18:00', end: '22:00' }],
        thursday: [{ start: '18:00', end: '22:00' }],
        friday: [{ start: '18:00', end: '22:00' }],
    },
    timezone: 'America/Noronha',
    status: 'active',
    lastAccess: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

export const allUsers: (User | Teacher)[] = [...users, ...teachers];

export const getAllUsers = (): (User | Teacher)[] => {
    const storedUsers = localStorage.getItem('userList');
    const currentUsers = storedUsers ? JSON.parse(storedUsers) : users;

    const storedTeachers = localStorage.getItem('teacherList');
    const currentTeachers = storedTeachers ? JSON.parse(storedTeachers) : teachers;

    return [...currentUsers, ...currentTeachers];
};

export const getContactsForUser = (currentUser: User): ChatContact[] => {
  if (typeof window === 'undefined') return [];

  const allCurrentUsers = getAllUsers();
  
  let potentialPartners: (User | Teacher)[] = [];

  if (currentUser.role === 'admin') {
      potentialPartners = allCurrentUsers.filter(u => u.id !== currentUser.id);
  } else if (currentUser.role === 'student') {
      potentialPartners = allCurrentUsers.filter(u => u.role === 'teacher' || u.role === 'admin');
  } else if (currentUser.role === 'teacher') {
      potentialPartners = allCurrentUsers.filter(u => u.role === 'student' || u.role === 'admin');
  }

  // NOTE: This logic might be incorrect for a real app.
  // It reads from a separate localStorage key `chatContacts` which might not be what's desired.
  // It should probably read from a user-specific key e.g. `chatContacts_${currentUser.id}`
  const storedContactsStr = localStorage.getItem('chatContacts');
  const contactsData: ChatContact[] = storedContactsStr ? JSON.parse(storedContactsStr) : initialChatContacts;
  const contactsMap = new Map(contactsData.map(c => [c.id, c]));

  const fullContactList = potentialPartners.map(partner => {
    const existingContact = contactsMap.get(partner.id);
    return {
      id: partner.id,
      name: partner.name,
      avatarUrl: partner.avatarUrl,
      role: partner.role,
      lastMessage: existingContact?.lastMessage || 'Nenhuma mensagem ainda.',
      lastMessageTimestamp: existingContact?.lastMessageTimestamp ? new Date(existingContact.lastMessageTimestamp) : new Date(0),
      unreadCount: existingContact?.unreadCount || 0,
    };
  });

  return fullContactList.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
};



export const subjects: Subject[] = [
  { id: 'subj-1', name: 'Matemática' },
  { id: 'subj-2', name: 'Português' },
  { id: 'subj-3', name: 'Física' },
  { id: 'subj-4', name: 'Redação' },
  { id: 'subj-5', name: 'História' },
  { id: 'subj-6', name: 'Ciências' },
  { id: 'subj-7', name: 'Espanhol' },
  { id: 'subj-8', name: 'Filosofia' },
  { id: 'subj-9', name: 'Geografia' },
  { id: 'subj-10', name: 'Inglês' },
  { id: 'subj-11', name: 'Sociologia' },
];

export let classPackages: ClassPackage[] = [
    { id: 'pkg-1', name: 'Aula Avulsa', numClasses: 1, pricePerClass: 105.00, durationMinutes: 90, popular: false },
    { id: 'pkg-2', name: 'Pacote 4 Aulas', numClasses: 4, pricePerClass: 95.00, durationMinutes: 90, popular: true },
    { id: 'pkg-3', name: 'Pacote 8 Aulas', numClasses: 8, pricePerClass: 85.00, durationMinutes: 90, popular: false },
];

// Function to update packages in memory (for prototype purposes)
export const updateClassPackages = (newPackages: ClassPackage[]) => {
  classPackages = newPackages;
};

const now = new Date();
export const scheduleEvents: ScheduleEvent[] = [
  {
    id: 'evt-1',
    title: 'Aula de Matemática',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 11, 30),
    studentId: 'user-1',
    teacherId: 'teacher-1',
    subject: 'Matemática',
    status: 'completed'
  },
  {
    id: 'evt-2',
    title: 'Aula de Redação',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 30),
    studentId: 'user-1',
    teacherId: 'teacher-2',
    subject: 'Redação',
    status: 'scheduled'
  },
  {
    id: 'evt-3',
    title: 'Aula de Física',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 30),
    studentId: 'user-2',
    teacherId: 'teacher-1',
    subject: 'Física',
    status: 'scheduled'
  },
];

export const chatContacts: ChatContact[] = [
  {
    id: 'admin-1',
    name: 'Admin Senra',
    avatarUrl: findImage('user-avatar-2'),
    lastMessage: 'Bem-vindo! Como posso ajudar?',
    lastMessageTimestamp: new Date(now.getTime() - 5 * 60000),
    unreadCount: 1,
  },
  {
    id: 'teacher-1',
    name: 'Ana Silva',
    avatarUrl: findImage('teacher-photo-1'),
    lastMessage: 'Claro, podemos revisar o último tópico na próxima aula.',
    lastMessageTimestamp: new Date(now.getTime() - 10 * 60000),
    unreadCount: 0,
  },
  {
    id: 'teacher-2',
    name: 'Carlos Lima',
    avatarUrl: findImage('teacher-photo-2'),
    lastMessage: 'Sua redação ficou ótima! Continue assim.',
    lastMessageTimestamp: new Date(now.getTime() - 2 * 24 * 60 * 60000),
    unreadCount: 2,
  },
];

export const chatMessages: ChatMessage[] = [
    { id: 'msg-1', senderId: 'user-1', receiverId: 'teacher-1', content: 'Olá, professora Ana! Tive uma dúvida sobre a última aula.', timestamp: new Date(now.getTime() - 15 * 60000)},
    { id: 'msg-2', senderId: 'teacher-1', receiverId: 'user-1', content: 'Oi, João! Pode perguntar.', timestamp: new Date(now.getTime() - 14 * 60000)},
    { id: 'msg-3', senderId: 'user-1', receiverId: 'teacher-1', content: 'É sobre a fórmula de Bhaskara. Poderíamos revisar?', timestamp: new Date(now.getTime() - 12 * 60000)},
    { id: 'msg-4', senderId: 'teacher-1', receiverId: 'user-1', content: 'Claro, podemos revisar o último tópico na próxima aula.', timestamp: new Date(now.getTime() - 10 * 60000)},
];

export const getMockUser = (role: UserRole, newUser?: Partial<User | Teacher>): User | Teacher => {
  if (role === 'admin') {
    const adminUser = { ...users.find(u => u.role === 'admin')!, ...newUser };
    (adminUser as Teacher).subjects = (newUser as Teacher)?.subjects || [];
    (adminUser as Teacher).bio = (newUser as Teacher)?.bio ||'Administrador da plataforma Aulas Online Senra.';
    adminUser.education = (newUser as User)?.education || [{ id: 'edu-admin', course: 'Gerenciamento de Sistemas', university: 'Internet University', type: 'Bacharelado', conclusionYear: '2015' }];
    return adminUser as Teacher;
  }
  if (role === 'teacher') {
    const defaultTeacher = teachers[0];
    const newTeacher: Teacher = {
        ...defaultTeacher,
        id: newUser?.id || defaultTeacher.id,
        name: newUser?.name || defaultTeacher.name,
        email: newUser?.email || defaultTeacher.email,
        avatarUrl: newUser?.avatarUrl || defaultTeacher.avatarUrl,
        subjects: (newUser as Teacher)?.subjects || [],
        bio: (newUser as Teacher)?.bio || 'Novo professor na plataforma! Perfil em breve.',
        education: (newUser as Teacher)?.education || [{ id: 'edu-new', course: 'A ser preenchido', university: 'A ser preenchido', type: 'Licenciatura', conclusionYear: '2024' }],
        availability: (newUser as Teacher)?.availability || {},
        status: 'active',
        role: 'teacher'
    };
    return newTeacher;
  }
  const defaultStudent = users.find(u => u.role === 'student' && u.id === 'user-1')!;
  const student = { ...defaultStudent, ...newUser };
  return student as Teacher;
};

export const suggestions: Suggestion[] = [
    { id: 'sug-1', submittedBy: 'João Aluno', userRole: 'student', type: 'suggestion', content: 'Seria ótimo ter um modo escuro no aplicativo!', status: 'received', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'sug-2', submittedBy: 'Ana Silva', userRole: 'teacher', type: 'bug', content: 'O calendário de agendamento às vezes não carrega nos fins de semana.', status: 'received', timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000) },
    { id: 'sug-3', submittedBy: 'Mariana Santos', userRole: 'student', type: 'suggestion', content: 'Adicionar uma seção de "materiais de aula" para download seria muito útil.', status: 'implemented', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), evaluationDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { id: 'sug-4', submittedBy: 'Carlos Lima', userRole: 'teacher', type: 'suggestion', content: 'Poderíamos ter um sistema de gamificação com medalhas para os alunos.', status: 'rejected', timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), evaluationDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
];

export let referralData: Referral[] = [
    { userId: 'teacher-1', code: 'ANA-5281', timesUsed: 2, totalBonus: 100.00, bonusType: 'money', referredUsers: ['user-2', 'user-4'] },
    { userId: 'user-1', code: 'JOAO-9872', timesUsed: 1, totalBonus: 1, bonusType: 'classes', referredUsers: ['user-3'] },
    { userId: 'teacher-2', code: 'CARLOS-3456', timesUsed: 0, totalBonus: 0, bonusType: 'money', referredUsers: [] },
];


export const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/schedule',
    icon: CalendarDays,
    label: 'Agenda',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/booking',
    icon: BookOpenCheck,
    label: 'Agendar Aula',
    roles: ['student', 'admin'],
  },
  {
    href: '/dashboard/chat',
    icon: MessageSquare,
    label: 'Chat',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/students',
    icon: Users,
    label: 'Alunos',
    roles: ['teacher', 'admin'],
  },
  {
    href: '/dashboard/teachers',
    icon: Briefcase,
    label: 'Professores',
    roles: ['admin', 'student'],
  },
    {
    href: '/dashboard/my-teachers',
    icon: Briefcase,
    label: 'Meus Professores',
    roles: ['student'],
  },
  {
    href: '/dashboard/packages',
    icon: WalletCards,
    label: 'Pacotes',
    roles: ['student'],
  },
  {
    href: '/dashboard/financial',
    icon: DollarSign,
    label: 'Financeiro',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/activity-history',
    icon: History,
    label: 'Histórico de Atividades',
    roles: ['student', 'teacher'],
  },
  {
    href: '/dashboard/simulados',
    icon: FileText,
    label: 'Simulados',
    roles: ['teacher', 'admin'],
  },
  {
    href: '/dashboard/suggestions',
    icon: Lightbulb,
    label: 'Sugestões',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/referrals',
    icon: Gift,
    label: 'Indicações',
    roles: ['student', 'teacher', 'admin'],
  },
];

export const adminNavItems: NavItem[] = [
  {
    href: '/dashboard/admin/packages',
    icon: Package,
    label: 'Planos',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/feedback-analysis',
    icon: FileText,
    label: 'Análise de Feedback',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/marketing',
    icon: TrendingUp,
    label: 'Marketing',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/crm',
    icon: HeartHandshake,
    label: 'CRM',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/aos-agents',
    icon: Bot,
    label: 'AOS Agents',
    roles: ['admin'],
  },
];

    


    


