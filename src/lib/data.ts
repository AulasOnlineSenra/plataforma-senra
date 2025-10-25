

import type { User, Teacher, Subject, ClassPackage, ScheduleEvent, ChatContact, ChatMessage, UserRole, Suggestion, Referral, NavItem } from '@/lib/types';
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
    bio: 'Estudante de engenharia buscando aprofundar meus conhecimentos em cálculo e física.',
    education: 'Cursando Engenharia Civil - Mackenzie',
  },
  {
    id: 'admin-1',
    name: 'Admin Senra',
    email: 'admin@example.com',
    avatarUrl: findImage('user-avatar-2'),
    role: 'admin',
    timezone: 'America/Sao_Paulo',
  },
  {
    id: 'user-2',
    name: 'Mariana Santos',
    email: 'mariana.santos@example.com',
    avatarUrl: 'https://picsum.photos/seed/student2/200/200',
    role: 'student',
    status: 'active',
    timezone: 'America/Manaus',
  },
  {
    id: 'user-3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@example.com',
    avatarUrl: 'https://picsum.photos/seed/student3/200/200',
    role: 'student',
    status: 'inactive',
    timezone: 'America/Recife',
  }
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
    education: 'Mestrado em Física Aplicada - USP',
    availability: {
      monday: ['09:00', '10:30', '15:00'],
      wednesday: ['09:00', '10:30', '15:00', '16:30'],
      friday: ['10:30', '12:00'],
    },
    timezone: 'America/Sao_Paulo',
    status: 'active',
  },
  {
    id: 'teacher-2',
    name: 'Carlos Lima',
    email: 'carlos.lima@example.com',
    avatarUrl: findImage('teacher-photo-2'),
    role: 'teacher',
    subjects: ['subj-2', 'subj-4'],
    bio: 'Especialista em literatura e redação, focado em preparar alunos para vestibulares e concursos.',
    education: 'Doutorado em Letras - UFRJ',
    availability: {
      tuesday: ['10:30', '12:00', '13:30'],
      thursday: ['10:30', '12:00', '13:30'],
    },
    timezone: 'America/Sao_Paulo',
    status: 'active',
  },
  {
    id: 'teacher-3',
    name: 'Beatriz Costa',
    email: 'beatriz.costa@example.com',
    avatarUrl: findImage('teacher-photo-3'),
    role: 'teacher',
    subjects: ['subj-5'],
    bio: 'Historiadora e geógrafa, adora contar histórias sobre o mundo e suas transformações.',
    education: 'Graduação em História - UNICAMP',
    availability: {
      monday: ['18:00', '19:30'],
      tuesday: ['18:00', '19:30'],
      wednesday: ['18:00', '19:30'],
      thursday: ['18:00', '19:30'],
      friday: ['18:00', '19:30'],
    },
    timezone: 'America/Noronha',
    status: 'active',
  },
];

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

export const getMockUser = (role: UserRole, newUser?: User): User | Teacher => {
  if (role === 'admin') {
    const adminUser = { ...users.find(u => u.role === 'admin')!, ...newUser };
    // Add teacher properties for profile editing
    (adminUser as Teacher).subjects = [];
    (adminUser as Teacher).bio = 'Administrador da plataforma Aulas Online Senra.';
    (adminUser as Teacher).education = 'Gerenciamento de Sistemas';
    return adminUser as Teacher;
  }
  if (role === 'teacher') {
    const defaultTeacher = teachers[0];
    const newTeacher: Teacher = { 
        ...defaultTeacher, 
        ...newUser, 
        subjects: [], 
        availability: {}, 
        status: 'active' 
    };
    return newTeacher;
  }
  // In a real app, you'd get the currently logged-in student
  const defaultStudent = users.find(u => u.role === 'student' && u.id === 'user-1')!;
  const student = { ...defaultStudent, ...newUser };
  return student as Teacher;
};

export const suggestions: Suggestion[] = [
    { id: 'sug-1', submittedBy: 'João Aluno', userRole: 'student', type: 'suggestion', content: 'Seria ótimo ter um modo escuro no aplicativo!', status: 'received', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'sug-2', submittedBy: 'Ana Silva', userRole: 'teacher', type: 'bug', content: 'O calendário de agendamento às vezes não carrega nos fins de semana.', status: 'received', timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000) },
    { id: 'sug-3', submittedBy: 'Mariana Santos', userRole: 'student', type: 'suggestion', content: 'Adicionar uma seção de "materiais de aula" para download seria muito útil.', status: 'implemented', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { id: 'sug-4', submittedBy: 'Carlos Lima', userRole: 'teacher', type: 'suggestion', content: 'Poderíamos ter um sistema de gamificação com medalhas para os alunos.', status: 'rejected', timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
];

export let referralData: Referral[] = [
    { userId: 'teacher-1', code: 'ANA-5281', timesUsed: 5, totalBonus: 250.00 },
    { userId: 'user-1', code: 'JOAO-9872', timesUsed: 2, totalBonus: 100.00 },
    { userId: 'teacher-2', code: 'CARLOS-3456', timesUsed: 8, totalBonus: 400.00 },
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
    roles: ['student'],
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
    href: '/dashboard/admin/settings',
    icon: KeyRound,
    label: 'Credenciais',
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
