

export type UserRole = 'admin' | 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  timezone?: string;
  nickname?: string;
  phone?: string;
  bio?: string;
  education?: string;
}

export interface Subject {
  id: string;
  name:string;
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[]; // array of subject IDs
  availability: Record<string, string[]>; // e.g. { "monday": ["09:00", "10:00"] }
  status: 'active' | 'hidden';
}

export interface ClassPackage {
  id: string;
  name: string;
  numClasses: number;
  pricePerClass: number;
  durationMinutes: number;
  popular: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  studentId: string;
  teacherId: string;
  subject: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export interface ChatContact {
  id: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
}

export interface Suggestion {
  id: string;
  submittedBy: string;
  userRole: UserRole;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'received' | 'rejected' | 'implemented';
  timestamp: Date;
  evaluationDate?: Date;
}

export interface Referral {
  userId: string;
  code: string;
  timesUsed: number;
  totalBonus: number;
}

export interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    roles: UserRole[];
}
