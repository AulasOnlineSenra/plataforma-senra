'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FolderOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { getLessonsForUser } from '@/app/actions/bookings';
import { getMockUser } from '@/lib/data';
import { User, Teacher } from '@/lib/types';

type SubjectWithStats = {
  id: string;
  name: string;
  classCount: number;
  teachers: Teacher[];
  lessons: any[];
};

export default function MySubjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbLessons, setDbLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const updateData = () => {
      const loggedInUserStr = localStorage.getItem('currentUser');
      if (loggedInUserStr) {
        const user = JSON.parse(loggedInUserStr);
        setCurrentUser(user);
        loadDbLessons(user.id);
      } else {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const user = getMockUser(userRole as any || 'student');
        user.id = userId as string;
        setCurrentUser(user);
        if (userId) loadDbLessons(userId);
        else setLoading(false);
      }

      const storedTeachers = localStorage.getItem('teacherList');
      if (storedTeachers) {
        setTeachers(JSON.parse(storedTeachers));
      }
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const loadDbLessons = async (userId: string) => {
    const response = await getLessonsForUser(userId, 'student');
    if (response.success && response.data) {
      setDbLessons(response.data);
    }
    setLoading(false);
  };

  const myNotebooks: SubjectWithStats[] = useMemo(() => {
    if (!currentUser || loading) return [];
    
    const completedClasses = dbLessons.filter(event => 
      (event.status === 'COMPLETED')
    );
    
    const subjectStats: Record<string, { classCount: number, teacherIds: Set<string>, lessons: any[] }> = {};
    
    completedClasses.forEach((event: any) => {
      const subjectName = event.subject;
      if (!subjectName) return;
      
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { classCount: 0, teacherIds: new Set(), lessons: [] };
      }
      subjectStats[subjectName].classCount++;
      subjectStats[subjectName].teacherIds.add(event.teacherId);
      subjectStats[subjectName].lessons.push(event);
    });

    return Object.entries(subjectStats).map(([subjectKey, stats]) => {
      const subject = teachers.find(s => s.id === subjectKey || s.name === subjectKey);
      const subjectTeachers = teachers.filter(t => stats.teacherIds.has(t.id));
      return {
        id: subject?.id || subjectKey,
        name: subject?.name || subjectKey,
        classCount: stats.classCount,
        teachers: subjectTeachers,
        lessons: stats.lessons.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    }).sort((a, b) => b.classCount - a.classCount);
  }, [currentUser, dbLessons, teachers, loading]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Minhas Disciplinas</h1>
      </div>

      {/* Cadernos - Aulas Concluídas */}
      <div>
        <h2 className="font-headline text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Meus Cadernos
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Disciplinas com aulas concluídas — organize seus estudos por matéria.
        </p>
        <div className="grid gap-6">
          {myNotebooks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myNotebooks.map((notebook) => (
                <Link 
                  key={notebook.id} 
                  href={`/dashboard/my-subjects/${notebook.id}`}
                  className="block"
                >
                  <Card className="flex flex-col hover:shadow-md hover:border-brand-yellow/50 transition-all cursor-pointer">
                    <CardHeader className="bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-yellow flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-slate-900" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{notebook.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" />
                            {notebook.classCount} {notebook.classCount > 1 ? 'aulas' : 'aula'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-slate-500">Professores:</span>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden">
                        {notebook.teachers.map((teacher: any) => (
                          <Avatar key={teacher.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Últimas aulas: {notebook.lessons[0] ? new Date(notebook.lessons[0].date).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Você ainda não possui cadernos.</p>
                <p className="text-sm mt-1">Complete sua primeira aula para criar um caderno.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}