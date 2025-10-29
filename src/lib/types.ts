

export type UserRole = 'admin' | 'student' | 'teacher';

export type EducationType = 'Licenciatura' | 'Bacharelado' | 'Mestrado' | 'Doutorado' | 'Pós-graduação';

export interface EducationEntry {
  id: string;
  course: string;
  university: string;
  type: EducationType;
  conclusionYear: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export type Availability = Record<string, TimeRange[]>;


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
  education?: EducationEntry[];
  referredByCode?: string; // New field
  cpf?: string;
  birthDate?: string;
  address?: {
    zipCode?: string;
    state?: string;
    neighborhood?: string;
    street?: string;
    number?: string;
  },
  lastAccess?: string;
  classCredits?: number;
  activePackage?: string;
}

export interface Subject {
  id: string;
  name:string;
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[]; // array of subject IDs
  availability: Availability; // e.g. { "monday": [{ start: "09:00", end: "11:00" }] }
  status: 'active' | 'hidden' | 'deleted';
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
  description?: string;
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
  bonusType: 'money' | 'classes';
  referredUsers: string[]; // New field: Array of user IDs
}

export interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    roles: UserRole[];
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  packageName: string;
  amount: number;
  date: Date;
  paymentMethod: string;
}
