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
import { getLessonsForUser, updateLesson } from '@/app/actions/bookings';
import { getCachedLessons, setCachedLessons } from '@/lib/lessons-cache';
import { useToast } from '@/hooks/use-toast';

const subjectMap: Record<string, string> = {
  'default-subj-1': 'Matemática',
  'default-subj-2': 'Português',
  'default-subj-3': 'Física',
  'default-subj-4': 'Redação',
  'default-subj-5': 'História',
  'default-subj-6': 'Química',
  'default-subj-7': 'Espanhol',
  'default-subj-8': 'Filosofia',
  'default-subj-9': 'Geografia',
  'default-subj-10': 'Inglês',
  'default-subj-11': 'Sociologia',
  'default-subj-12': 'Biologia',
};

type Material = {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  isExercise?: boolean;
  responseUrl?: string;
  responseName?: string;
  responseDate?: string;
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
  const rawSubjectId = decodeURIComponent(params.subject as string);
  // rawSubjectId is now always the resolved display name (e.g. "Matemática")
  const subjectName = rawSubjectId;
  const resolveSubjectName = (raw: string) => subjectMap[raw] || raw;

  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingResponseId, setUploadingResponseId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLessons = async (userId: string) => {
    const cached = getCachedLessons(userId);
    if (cached) {
      setLessons(cached as LessonData[]);
      setLoading(false);
    }

    const result = await getLessonsForUser(userId, 'student');
    if (result.success && result.data) {
      setLessons(result.data as LessonData[]);
      setCachedLessons(userId, result.data);
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

  const handleUploadResponse = async (lessonId: string, materialId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Erro', description: 'Arquivo excede 5MB.', className: 'bg-red-600 text-white border-none' });
        return;
    }

    setUploadingResponseId(materialId);
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (!result.success) throw new Error(result.error || 'Erro no upload.');

        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const currentMaterials = parseMaterials(lesson.materials as string);
        const updatedMaterials = currentMaterials.map((m: any) => 
            m.id === materialId 
                ? { ...m, responseUrl: result.data.url, responseName: file.name, responseDate: new Date().toISOString() } 
                : m
        );

        const updateRes = await updateLesson(lessonId, { materials: JSON.stringify(updatedMaterials) });
        if (updateRes.success) {
            setLessons(lessons.map(l => l.id === lessonId ? { ...l, materials: JSON.stringify(updatedMaterials) } : l));
            // Update cache
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const cached = getCachedLessons(user.id);
                if (cached) {
                    const newCache = (cached as LessonData[]).map(l => l.id === lessonId ? { ...l, materials: JSON.stringify(updatedMaterials) } : l);
                    setCachedLessons(user.id, newCache);
                }
            }
            toast({ title: 'Resposta Enviada!', description: 'Seu arquivo foi salvo com sucesso.', className: 'bg-emerald-600 text-white border-none' });
        }
    } catch (error) {
        toast({ title: 'Erro', description: 'Falha ao enviar resposta.', className: 'bg-red-600 text-white border-none' });
    } finally {
        setUploadingResponseId(null);
        if (e.target) e.target.value = '';
    }
  };

  const completedLessons = useMemo(() => {
    return lessons
      .filter((lesson) =>
        // Normalize lesson.subject to display name before comparing
        // so both "default-subj-1" and "Matemática" match correctly
        lesson.status === 'COMPLETED' && resolveSubjectName(lesson.subject) === subjectName
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [lessons, subjectName]);

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
          Aulas de {subjectName}
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
                          {lesson.customTitle || subjectMap[lesson.subject] || lesson.subject || ''}
                        </span>
                        <br />
                        <span className="font-medium text-xs">{lesson.teacher?.name || '-'}</span>
                        <span className="text-muted-foreground"> - </span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(lesson)}</span>
                        {lesson.materials && parseMaterials(lesson.materials).length > 0 && (
                          <div className="mt-2 flex flex-col gap-2">
                            {parseMaterials(lesson.materials).map((material) => (
                              <div key={material.id} className="flex flex-col items-start gap-1 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                <button 
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
                                  className={`flex items-center gap-1.5 px-3 py-1.5 ${material.isExercise ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} rounded-lg text-sm font-medium cursor-pointer w-full text-left`}
                                >
                                  <File className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{material.name}</span>
                                  {material.isExercise && <span className="ml-auto bg-amber-200/50 text-amber-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Exercício</span>}
                                </button>
                                {material.isExercise && (
                                  <div className="w-full mt-1 ml-2 border-l-2 border-slate-200 pl-3 py-1 flex items-center justify-between">
                                    {!material.responseUrl ? (
                                      <div className="relative">
                                          <input 
                                              type="file" 
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                              onChange={(e) => handleUploadResponse(lesson.id, material.id, e)}
                                              disabled={uploadingResponseId === material.id}
                                          />
                                          <Button size="sm" variant="outline" className="rounded-lg bg-white h-7 text-xs border-dashed border-slate-300 hover:border-brand-yellow hover:text-brand-yellow hover:bg-amber-50" disabled={uploadingResponseId === material.id}>
                                              {uploadingResponseId === material.id ? 'Enviando...' : 'Enviar Resposta'}
                                          </Button>
                                      </div>
                                    ) : (
                                      <button onClick={() => window.open(material.responseUrl, '_blank')} className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline bg-emerald-50 px-2 py-1 rounded-md">
                                        Resposta enviada: {material.responseName}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
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