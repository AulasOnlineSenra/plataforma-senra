import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

async function main() {
  // Lista padrão de disciplinas como fallback
  const defaultSubjects = [
    { id: 'default-subj-1', name: 'Matemática' },
    { id: 'default-subj-2', name: 'Português' },
    { id: 'default-subj-3', name: 'Física' },
    { id: 'default-subj-4', name: 'Redação' },
    { id: 'default-subj-5', name: 'História' },
    { id: 'default-subj-6', name: 'Química' },
    { id: 'default-subj-7', name: 'Espanhol' },
    { id: 'default-subj-8', name: 'Filosofia' },
    { id: 'default-subj-9', name: 'Geografia' },
    { id: 'default-subj-10', name: 'Inglês' },
    { id: 'default-subj-11', name: 'Sociologia' },
    { id: 'default-subj-12', name: 'Biologia' },
  ];

  const subjectMap = new Map<string, string>();
  defaultSubjects.forEach(s => subjectMap.set(s.id, s.name));

  // Buscar do banco de dados (se houver alguma lá)
  try {
    const dbSubjects = await prisma.subject.findMany();
    dbSubjects.forEach((s) => {
      subjectMap.set(s.id, s.name);
    });
  } catch (err) {
    console.error('Erro ao ler disciplinas do banco:', err);
  }

  // Notificações com type class_scheduled ou class_cancelled
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
    } else {
      // Caso não encontre a aula no banco, fazemos a correção fallback de fuso horário
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
        let newMessage = message.replace(/às \d{2}:\d{2} - \d{2}:\d{2}/, newRange);

        // Se a mensagem continha algum ID residual default-subj-XX (por segurança)
        for (const [id, name] of subjectMap.entries()) {
          if (newMessage.includes(id)) {
            newMessage = newMessage.replace(new RegExp(id, 'g'), name);
          }
        }

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

  // Correção secundária direta para quaisquer strings contendo default-subj- no banco (garantia extra)
  const allNotifications = await prisma.notification.findMany();
  for (const notif of allNotifications) {
    let newMessage = notif.message;
    let changed = false;
    for (const [id, name] of subjectMap.entries()) {
      if (newMessage.includes(id)) {
        newMessage = newMessage.replace(new RegExp(id, 'g'), name);
        changed = true;
      }
    }
    if (changed) {
      console.log(`Correção extra de ID de disciplina para a notificação ${notif.id}:`);
      console.log(`  De:  "${notif.message}"`);
      console.log(`  Para: "${newMessage}"`);
      await prisma.notification.update({
        where: { id: notif.id },
        data: { message: newMessage }
      });
      updatedCount++;
    }
  }

  console.log(`\nConcluído! ${updatedCount} notificações corrigidas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
