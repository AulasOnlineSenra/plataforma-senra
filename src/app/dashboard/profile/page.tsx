

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
import { UserRole, Teacher, User, EducationEntry, EducationType } from '@/lib/types';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { EditableInput } from '@/components/editable-input';
import { EditableTextarea } from '@/components/editable-textarea';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  <svg role="img" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.5 3.375a.375.375 0 0 0-.375.375v16.5a.375.375 0 0 0 .375.375h.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375h-.75zM19.5 3.375A.375.375 0 0 0 19.125 3h-3.75a.375.375 0 0 0-.375.375v16.875a.375.375 0 0 0 .375.375h3.75a.375.375 0 0 0 .375-.375V3.75a.375.375 0 0 0-.375-.375zM.375 3.375h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375H.375a.375.375 0 0 1-.375-.375V3.75A.375.375 0 0 1 .375 3.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375zm3.75 0h.75a.375.375 0 0 1 .375.375v16.875a.375.375 0 0 1-.375.375h-.75a.375.375