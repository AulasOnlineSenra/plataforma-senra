'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, History, Video } from 'lucide-react';
import { getLessonsForUser } from '@/app/actions/bookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  endDate: string | Date;
  meetingLink?: string | null;
  teacher?: { name: string } | null;
};

export default function HistoricoPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole') || 'student';
      if (!userId) {
        setLoading(false);
        return;
      }

      const result = await getLessonsForUser(userId, role);
      if (result.success && result.data) {
        setLessons(result.data as LessonItem[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Histórico de Aulas</h1>
        <p className="mt-1 text-sm text-slate-600">Acesso rapido as aulas confirmadas.</p>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <History className="h-5 w-5 text-[#FFC107]" />
            Aulas do aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {loading && <p className="text-sm text-slate-500">Carregando...</p>}

          {!loading && lessons.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              Nenhuma aula encontrada.
            </p>
          )}

          {!loading &&
            lessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{lesson.subject}</p>
                  <p className="text-sm text-slate-600">Professor: {lesson.teacher?.name || '-'}</p>
                  <p className="text-sm text-slate-600">
                    {format(new Date(lesson.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })} -{' '}
                    {format(new Date(lesson.endDate), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lesson.status}</Badge>
                  {lesson.status === 'CONFIRMED' && lesson.meetingLink && (
                    <Button asChild className="rounded-2xl bg-slate-900 text-slate-50 hover:bg-slate-800">
                      <a href={lesson.meetingLink} target="_blank" rel="noreferrer">
                        <Video className="mr-2 h-4 w-4" />
                        Entrar na Sala
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
