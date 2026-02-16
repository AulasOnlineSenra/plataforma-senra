import type { NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  MessageSquare,
  WalletCards,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  Lightbulb,
  Gift,
  History,
  Bell,
  BookCopy,
  Package,
  TrendingUp,
  HeartHandshake,
  Bot,
} from 'lucide-react';

export const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notificacoes', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/schedule', icon: CalendarDays, label: 'Agenda', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/booking', icon: BookOpenCheck, label: 'Agendar Aula', roles: ['student', 'admin'] },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Chat', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/students', icon: Users, label: 'Alunos', roles: ['teacher', 'admin'] },
  { href: '/dashboard/teachers', icon: Briefcase, label: 'Professores', roles: ['admin', 'student'] },
  { href: '/dashboard/my-teachers', icon: Briefcase, label: 'Meus Professores', roles: ['student'] },
  { href: '/dashboard/my-subjects', icon: BookCopy, label: 'Minhas Disciplinas', roles: ['student'] },
  { href: '/dashboard/simulados', icon: FileText, label: 'Simulados', roles: ['teacher', 'admin', 'student'] },
  { href: '/dashboard/packages', icon: WalletCards, label: 'Pacotes', roles: ['student'] },
  { href: '/dashboard/financial', icon: DollarSign, label: 'Financeiro', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/activity-history', icon: History, label: 'Historico', roles: ['student', 'teacher'] },
  { href: '/dashboard/suggestions', icon: Lightbulb, label: 'Sugestoes', roles: ['student', 'teacher', 'admin'] },
  { href: '/dashboard/referrals', icon: Gift, label: 'Indicacoes', roles: ['student', 'teacher', 'admin'] },
];

export const adminNavItems: NavItem[] = [
  { href: '/dashboard/admin/packages', icon: Package, label: 'Planos', roles: ['admin'] },
  { href: '/dashboard/admin/feedback-analysis', icon: FileText, label: 'Analise de Feedback', roles: ['admin'] },
  { href: '/dashboard/admin/marketing', icon: TrendingUp, label: 'Marketing', roles: ['admin'] },
  { href: '/dashboard/admin/crm', icon: HeartHandshake, label: 'CRM', roles: ['admin'] },
  { href: '/dashboard/admin/aos-agents', icon: Bot, label: 'AOS Agents', roles: ['admin'] },
];

