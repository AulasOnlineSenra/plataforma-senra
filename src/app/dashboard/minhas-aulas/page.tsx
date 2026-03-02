'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, ExternalLink, Link2, Video } from 'lucide-react';
import { getLessonsForUser, confirmLesson } from '@/app/actions/bookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  endDate: string | Date;
  meetingLink?: string | null;
  student?: { name: string } | null;
  teacher?: { name: string } | null;
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  CONFIRMED: 'bg-[#FFC107]/20 text-slate-900 border-[#FFC107]/40',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export default function MinhasAulasPage() {
  const { toast } = useToast();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingLesson, setConfirmingLesson] = useState<LessonItem | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLessons = async (currentUserId: string, currentRole: string) => {
    setLoading(true);
    const response = await getLessonsForUser(currentUserId, currentRole);
    if (response.success && response.data) {
      setLessons(response.data as LessonItem[]);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possivel carregar as aulas.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole');
    const currentUserId = localStorage.getItem('userId');
    setRole(currentRole);
    setUserId(currentUserId);

    if (currentRole && currentUserId) {
      loadLessons(currentUserId, currentRole);
    } else {
      setLoading(false);
    }
  }, []);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [lessons]
  );

  const openConfirmModal = (lesson: LessonItem) => {
    setConfirmingLesson(lesson);
    setMeetingLink(lesson.meetingLink || '');
  };

  const handleConfirmLesson = async () => {
    if (!confirmingLesson || !userId) return;
    setSaving(true);
    const result = await confirmLesson(confirmingLesson.id, userId, meetingLink);

    if (result.success) {
      toast({ title: 'Aula confirmada', description: 'O link da sala foi salvo com sucesso.' });
      setConfirmingLesson(null);
      setMeetingLink('');
      if (role) {
        await loadLessons(userId, role);
      }
    } else {
      toast({ variant: 'destructive', title: 'Erro ao confirmar', description: result.error });
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Minhas Aulas</h1>
        <p className="mt-1 text-sm text-slate-600">
          {role === 'teacher'
            ? 'Confirme as aulas pendentes com o link do Google Meet.'
            : 'Acompanhe o status e entre na sala quando sua aula estiver confirmada.'}
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CalendarCheck2 className="h-5 w-5 text-[#FFC107]" />
            Agenda de aulas
          </CardTitle>
          <CardDescription>Lista sincronizada com o banco de dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {loading && <p className="text-sm text-slate-500">Carregando aulas...</p>}

          {!loading && sortedLessons.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              Nenhuma aula encontrada.
            </div>
          )}

          {!loading &&
            sortedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{lesson.subject}</p>
                    <Badge variant="outline" className={statusStyles[lesson.status] || statusStyles.PENDING}>
                      {lesson.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {format(new Date(lesson.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })} -{' '}
                    {format(new Date(lesson.endDate), 'HH:mm', { locale: ptBR })}
                  </p>
                  <p className="text-sm text-slate-600">
                    {role === 'teacher' ? `Aluno: ${lesson.student?.name || '-'}` : `Professor: ${lesson.teacher?.name || '-'}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {role === 'teacher' && lesson.status === 'PENDING' && (
                    <Button
                      onClick={() => openConfirmModal(lesson)}
                      className="rounded-2xl bg-[#FFC107] px-4 text-slate-900 hover:bg-amber-300"
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Confirmar Aula
                    </Button>
                  )}

                  {role !== 'teacher' && lesson.status === 'CONFIRMED' && lesson.meetingLink && (
                    <Button
                      asChild
                      className="rounded-2xl bg-slate-900 px-4 text-slate-50 hover:bg-slate-800"
                    >
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

      <Dialog open={!!confirmingLesson} onOpenChange={() => setConfirmingLesson(null)}>
        <DialogContent className="rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Confirmar Aula</DialogTitle>
            <DialogDescription>Cole o link da sala do Google Meet para liberar acesso ao aluno.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="meeting-link">Link da sala</Label>
            <Input
              id="meeting-link"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              className="rounded-2xl border-slate-300"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingLesson(null)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmLesson}
              disabled={saving}
              className="rounded-2xl bg-[#FFC107] text-slate-900 hover:bg-amber-300"
            >
              {saving ? 'Salvando...' : 'Salvar e Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
