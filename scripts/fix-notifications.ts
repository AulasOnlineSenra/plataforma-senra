import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

async function main() {
  // Buscar todas as disciplinas para criar um mapa de ID -> Nome amigável
  const subjects = await prisma.subject.findMany();
  const subjectMap = new Map<string, string>();
  subjects.forEach((s) => {
    subjectMap.set(s.id, s.name);
  });

  const notifications = await prisma.notification.findMany({
    where: {
      type: { in: ['class_scheduled', 'class_cancelled'] }
    }
  });

  console.log(`Encontradas ${notifications.length} notificações de aulas.`);

  let updatedCount = 0;

  for (const notif of notifications) {
    const message = notif.message;
    // Tenta encontrar a data na mensagem (dd/mm/yyyy)
    const dateMatch = message.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) continue;

    const [_, day, month, year] = dateMatch;
    const dateString = `${year}-${month}-${day}`; // yyyy-mm-dd
    
    // Vamos buscar as aulas desse usuário (aluno ou professor) nesse dia
    const startOfDay = new Date(`${dateString}T00:00:00Z`);
    startOfDay.setHours(startOfDay.getHours() - 12);
    const endOfDay = new Date(`${dateString}T23:59:59Z`);
    endOfDay.setHours(endOfDay.getHours() + 12);

    const lessons = await prisma.lesson.findMany({
      where: {
        OR: [
          { studentId: notif.userId },
          { teacherId: notif.userId }
        ],
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        student: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });

    if (lessons.length > 0) {
      const lesson = lessons[0];
      const correctStart = lesson.date;
      const correctEnd = lesson.endDate || new Date(correctStart.getTime() + 90 * 60 * 1000);

      const formattedStartStr = formatInTimeZone(correctStart, 'America/Sao_Paulo', "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const formattedEndStr = formatInTimeZone(correctEnd, 'America/Sao_Paulo', "HH:mm");
      const correctFormattedDate = `${formattedStartStr} - ${formattedEndStr}`;

      // Resolve o nome da disciplina usando o map (ex: default-subj-12 -> Biologia)
      const subjectName = subjectMap.get(lesson.subject) || lesson.subject;

      let newMessage = message;
      if (notif.type === 'class_scheduled') {
        if (message.includes('Sua aula de')) {
          newMessage = `Sua aula de ${subjectName} foi agendada para o dia ${correctFormattedDate}.`;
        } else {
          newMessage = `O aluno ${lesson.student.name} agendou uma aula de ${subjectName} para o dia ${correctFormattedDate}.`;
        }
      } else if (notif.type === 'class_cancelled') {
        newMessage = `A aula de ${subjectName} marcada para ${correctFormattedDate} foi cancelada.`;
      }

      if (newMessage !== message) {
        console.log(`Atualizando notificação ${notif.id}:`);
        console.log(`  De:  "${message}"`);
        console.log(`  Para: "${newMessage}"`);
        await prisma.notification.update({
          where: { id: notif.id },
          data: { message: newMessage }
        });
        updatedCount++;
      }
    }
  }

  console.log(`\nConcluído! ${updatedCount} notificações corrigidas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
