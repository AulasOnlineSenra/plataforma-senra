import type { User, Teacher, Subject, ClassPackage, ScheduleEvent, ChatContact, ChatMessage } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'João Aluno',
    email: 'joao.aluno@example.com',
    avatarUrl: findImage('user-avatar-1'),
    role: 'student',
    status: 'active',
  },
  {
    id: 'admin-1',
    name: 'Admin Senra',
    email: 'admin@example.com',
    avatarUrl: findImage('user-avatar-2'),
    role: 'admin',
  },
  {
    id: 'user-2',
    name: 'Mariana Santos',
    email: 'mariana.santos@example.com',
    avatarUrl: 'https://picsum.photos/seed/student2/200/200',
    role: 'student',
    status: 'active'
  },
  {
    id: 'user-3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@example.com',
    avatarUrl: 'https://picsum.photos/seed/student3/200/200',
    role: 'student',
    status: 'inactive'
  }
];

export const teachers: Teacher[] = [
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

export const classPackages: ClassPackage[] = [
    { id: 'pkg-1', name: 'Aula Avulsa', numClasses: 1, pricePerClass: 105.00, popular: false },
    { id: 'pkg-2', name: 'Pacote 4 Aulas', numClasses: 4, pricePerClass: 95.00, popular: true },
    { id: 'pkg-3', name: 'Pacote 8 Aulas', numClasses: 8, pricePerClass: 85.00, popular: false },
];

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

export const getMockUser = (role: 'student' | 'admin' | 'teacher'): User => {
  if (role === 'admin') {
    return users.find(u => u.role === 'admin')!;
  }
  if (role === 'teacher') {
    return teachers[0];
  }
  return users.find(u => u.role === 'student')!;
};
