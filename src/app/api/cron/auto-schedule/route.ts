import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfWeek, addDays, isBefore } from "date-fns";

export const runtime = "nodejs"; // Forçando o ambiente node para acesso seguro ao prisma e crypto
export const maxDuration = 300; // 5 minutos de timeout no Vercel (se aplicável)

export async function GET(request: Request) {
  // Segurança básica: Se estivermos no Vercel/Cron, podemos checar um Header de autorização
  // No caso de VPS manual via crontab, aceitaremos a requisição ou usaremos um token simples (CRON_SECRET)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "senra-cron-secret-123";
  
  // Validando segurança (opcional mas recomendado)
  if (authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV === "production") {
    // Apenas comente essa linha se quiser testar livremente sem header
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Iniciando agendamento automático...");
    
    // 1. Busca todos os usuários (alunos) que têm a flag autoSchedule ativada e que tenham créditos > 0
    const studentsToSchedule = await prisma.user.findMany({
      where: {
        autoSchedule: true,
        status: "active",
        credits: {
          gt: 0
        },
        role: "student"
      }
    });

    console.log(`[CRON] Encontrados ${studentsToSchedule.length} alunos elegíveis para agendamento automático.`);

    let totalLessonsCreated = 0;
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 }); // Domingo
    
    // Agendar para a SEMANA ATUAL se o cron rodar no domingo,
    // ou para a PRÓXIMA SEMANA se rodar em outro dia
    const isSunday = now.getDay() === 0;
    const weekStartToUse = isSunday ? currentWeekStart : addDays(currentWeekStart, 7);

    for (const student of studentsToSchedule) {
      // 2. Busca o cronograma (ScheduleStructure) do aluno - modelo correto do banco
      const blocks = await prisma.scheduleStructure.findMany({
        where: { userId: student.id }
      });

      // Filtra os blocos que possuem professor definido (necessário para agendamento)
      const validBlocks = blocks.filter(b => b.teacherId && b.teacherId !== "none");
      
      if (validBlocks.length === 0) {
        console.log(`[CRON] Aluno ${student.email} não tem cronograma com professores definidos. Pulando.`);
        continue;
      }

      console.log(`[CRON] Aluno ${student.email} tem ${validBlocks.length} bloco(s) válidos.`);

      // 3. Verifica se já existem aulas agendadas para essa semana (evita duplicatas)
      const weekStart = weekStartToUse;
      const weekEnd = addDays(weekStart, 7);
      
      const existingLessons = await prisma.lesson.findMany({
        where: {
          studentId: student.id,
          date: {
            gte: weekStart,
            lt: weekEnd
          },
          status: { not: "CANCELLED" }
        }
      });

      // 4. Monta os agendamentos projetando as datas para a PRÓXIMA SEMANA
      // IMPORTANTE: Os horários no cronograma estão em BRT (UTC-3).
      // O banco salva em UTC, então somamos 3h para converter corretamente.
      const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // 3 horas em ms

      const preBookings = validBlocks.map(b => {
        // dayOfWeek: 0=Domingo, 1=Segunda, ..., 6=Sábado
        const targetDate = addDays(weekStart, b.dayOfWeek);
        const [h, m] = b.startTime.split(':').map(Number);
        // Configura a hora em UTC como se fosse BRT (adiciona 3h offset)
        targetDate.setUTCHours(h + 3, m, 0, 0);

        const endDate = addDays(weekStart, b.dayOfWeek);
        const [eh, em] = b.endTime.split(':').map(Number);
        endDate.setUTCHours(eh + 3, em, 0, 0);

        return {
          subject: b.subject,
          teacherId: b.teacherId as string,
          date: targetDate,
          endDate: endDate,
        };
      });

      // Remove bookings que já têm aula naquele horário (evita duplicatas)
      const bookingsToCreate = preBookings.filter(booking => {
        return !existingLessons.some(existing => {
          const existingTime = new Date(existing.date).getTime();
          const bookingTime = booking.date.getTime();
          return Math.abs(existingTime - bookingTime) < 60 * 60 * 1000; // dentro de 1 hora
        });
      });

      if (bookingsToCreate.length === 0) {
        console.log(`[CRON] Aluno ${student.email} já tem todas as aulas agendadas para essa semana. Pulando.`);
        continue;
      }

      // 5. NÃO debitamos créditos aqui.
      // O sistema de créditos já desconta automaticamente quando a aula é marcada como COMPLETED
      // (via getLessonsForUser em bookings.ts e via updateLesson).
      // O cron apenas AGENDA as aulas — o débito acontece após a conclusão.
      const finalBookingsToCreate = bookingsToCreate;

      // 6. Cria as aulas no banco em uma Transação segura (sem débito de créditos)
      await prisma.$transaction(async (tx) => {
        for (const booking of finalBookingsToCreate) {
          await tx.lesson.create({
            data: {
              studentId: student.id,
              teacherId: booking.teacherId,
              subject: booking.subject,
              date: booking.date,
              endDate: booking.endDate,
              status: "CONFIRMED",
            }
          });
        }
      });

      totalLessonsCreated += lessonsToCreateCount;
      console.log(`[CRON] Agendadas ${lessonsToCreateCount} aulas para ${student.email}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Agendamento automático concluído",
      lessonsCreated: totalLessonsCreated,
      studentsProcessed: studentsToSchedule.length
    });

  } catch (error: any) {
    console.error("[CRON] Erro crítico na execução:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
