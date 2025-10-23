export type UserRole = 'admin' | 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Teacher extends User {
  role: 'teacher';
  nickname?: string;
  phone?: string;
  subjects: string[]; // array of subject IDs
  bio: string;
  education: string;
  availability: Record<string, string[]>; // e.g. { "monday": ["09:00", "10:00"] }
}

export interface ClassPackage {
  id: string;
  name: string;
  numClasses: number;
  pricePerClass: number;
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
