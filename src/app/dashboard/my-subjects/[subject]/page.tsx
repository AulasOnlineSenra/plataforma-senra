'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, GraduationCap, File } from 'lucide-react';
import { getLessonsForUser } from '@/app/actions/bookings';

const subjectMap: Record<string, string> = {
  'subj-1': 'Matemática',
  'subj-2': 'Português',
  'subj-3': 'Física',
  'subj-4': 'Redação',
  'subj-5': 'História',
  'subj-6': 'Química',
  'subj-7': 'Espanhol',
  'subj-8': 'Filosofia',
  'subj-9': 'Geografia',
  'subj-10': 'Inglês',
  'subj-11': 'Sociologia',
  'subj-12': 'Biologia',
};

type Material = {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
};

type LessonData = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  endDate?: string | Date;
  customTitle?: string | null;
  materials?: string | null;
  teacher?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
};

const parseMaterials = (materialsStr: string | null): Material[] => {
  if (!materialsStr) return [];
  try {
    return JSON.parse(materialsStr);
  } catch {
    return [];
  }
};

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const rawSubjectId = params.subject as string;
  const subjectName = subjectMap[rawSubjectId] || rawSubjectId;

  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLessons = async (userId: string) => {
    const result = await getLessonsForUser(userId, 'student');
    if (result.success && result.data) {
      setLessons(result.data as LessonData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      loadLessons(user.id);
    } else {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        loadLessons(storedUserId);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const completedLessons = useMemo(() => {
    return lessons
      .filter((lesson) =>
        lesson.status === 'COMPLETED'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [lessons]);

  const formatDateTime = (lesson: LessonData) => {
    const startDate = new Date(lesson.date);
    const endDate = lesson.endDate ? new Date(lesson.endDate) : new Date(startDate.getTime() + 90 * 60 * 1000);
    
    const startFormatted = format(startDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const endFormatted = format(endDate, "HH:mm");
    
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/dashboard/my-subjects')} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="ml-28 mr-10">
        <h2 className="font-headline text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Aulas
        </h2>

        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Carregando...</p>
            </CardContent>
          </Card>
        ) : completedLessons.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Nenhuma aula realizada.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead className="w-16"></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedLessons.map((lesson, index) => (
                    <TableRow key={lesson.id} className="-mt-10 -mb-10">
                      <TableCell className="font-bold text-muted-foreground w-16 text-2xl py-0">
                        {completedLessons.length - index}
                      </TableCell>
                      <TableCell className="w-16">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={lesson.teacher?.avatarUrl || undefined} alt={lesson.teacher?.name} />
                          <AvatarFallback>{lesson.teacher?.name?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="pt-10">
                        <span className="text-amber-600 text-2xl">
                          {lesson.customTitle || lesson.subject || ''}
                        </span>
                        <br />
                        <span className="font-medium text-xs">{lesson.teacher?.name || '-'}</span>
                        <span className="text-muted-foreground"> - </span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(lesson)}</span>
                        {lesson.materials && parseMaterials(lesson.materials).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parseMaterials(lesson.materials).map((material) => (
                              <button 
                                key={material.id}
                                onClick={() => {
                                  if (material.url.startsWith('data:')) {
                                    const byteCharacters = atob(material.url.split(',')[1]);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: material.type });
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                  } else {
                                    window.open(material.url, '_blank');
                                  }
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 cursor-pointer"
                              >
                                <File className="h-3 w-3" />
                                {material.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}