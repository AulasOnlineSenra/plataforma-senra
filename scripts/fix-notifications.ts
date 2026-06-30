import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

async function main() {
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
    // Definimos o início e o fim do dia em UTC para cobrir qualquer fuso
    const startOfDay = new Date(`${dateString}T00:00:00Z`);
    startOfDay.setHours(startOfDay.getHours() - 12); // margem de segurança
    const endOfDay = new Date(`${dateString}T23:59:59Z`);
    endOfDay.setHours(endOfDay.getHours() + 12); // margem de segurança

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

    // Se acharmos a aula correspondente nesse dia
    if (lessons.length > 0) {
      // Se houver mais de uma aula, pegamos a que melhor aproxima ou a primeira
      const lesson = lessons[0];
      const correctStart = lesson.date;
      const correctEnd = lesson.endDate || new Date(correctStart.getTime() + 90 * 60 * 1000);

      const formattedStartStr = formatInTimeZone(correctStart, 'America/Sao_Paulo', "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const formattedEndStr = formatInTimeZone(correctEnd, 'America/Sao_Paulo', "HH:mm");
      const correctFormattedDate = `${formattedStartStr} - ${formattedEndStr}`;

      let newMessage = message;
      if (notif.type === 'class_scheduled') {
        if (message.includes('Sua aula de')) {
          // Mensagem para o aluno
          newMessage = `Sua aula de ${lesson.subject} foi agendada para o dia ${correctFormattedDate}.`;
        } else {
          // Mensagem para o professor
          newMessage = `O aluno ${lesson.student.name} agendou uma aula de ${lesson.subject} para o dia ${correctFormattedDate}.`;
        }
      } else if (notif.type === 'class_cancelled') {
        newMessage = `A aula de ${lesson.subject} marcada para ${correctFormattedDate} foi cancelada.`;
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
    } else {
      // Caso não encontre a aula no banco, fazemos uma aproximação de string subtraindo 3 horas
      const timeRangeMatch = message.match(/às (\d{2}):(\d{2}) - (\d{2}):(\d{2})/);
      if (timeRangeMatch) {
        const [_, sh, sm, eh, em] = timeRangeMatch;
        let startH = parseInt(sh) - 3;
        let endH = parseInt(eh) - 3;
        if (startH < 0) startH += 24;
        if (endH < 0) endH += 24;
        
        const newStartStr = `${String(startH).padStart(2, '0')}:${sm}`;
        const newEndStr = `${String(endH).padStart(2, '0')}:${em}`;
        const newRange = `às ${newStartStr} - ${newEndStr}`;
        const newMessage = message.replace(/às \d{2}:\d{2} - \d{2}:\d{2}/, newRange);

        if (newMessage !== message) {
          console.log(`Atualizando notificação (fallback regex) ${notif.id}:`);
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
  }

  console.log(`\nConcluído! ${updatedCount} notificações corrigidas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
