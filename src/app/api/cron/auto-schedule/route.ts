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
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 });
    
    // Configurado para pegar a PRÓXIMA semana, conforme solicitado
    const nextWeekStart = addDays(currentWeekStart, 7);

    for (const student of studentsToSchedule) {
      // 2. Busca o cronograma (ScheduleBlock) do aluno
      const blocks = await prisma.scheduleBlock.findMany({
        where: { userId: student.id }
      });

      // Filtra os blocos que possuem professor definido (necessário para agendamento)
      const validBlocks = blocks.filter(b => b.teacherId && b.teacherId !== "none");
      
      if (validBlocks.length === 0) continue;

      // 3. Monta os "Pre-Bookings" projetando as datas para a PRÓXIMA SEMANA
      const preBookings = validBlocks.map(b => {
        let targetDate = addDays(nextWeekStart, b.dayOfWeek);
        const [h, m] = b.startTime.split(':').map(Number);
        targetDate.setHours(h, m, 0, 0);

        return {
          subjectId: b.subject,
          teacherId: b.teacherId as string,
          date: targetDate,
          start: b.startTime,
          end: b.endTime,
        };
      });

      // 4. Regra de Créditos (Debitar no máximo o que o aluno tem de saldo)
      const creditsAvailable = student.credits;
      const lessonsToCreateCount = Math.min(preBookings.length, creditsAvailable);
      
      if (lessonsToCreateCount === 0) continue; // Por segurança (embora já filtramos > 0)

      const finalBookingsToCreate = preBookings.slice(0, lessonsToCreateCount);

      // 5. Injeta no banco (Agendamentos e Debita o Saldo) em uma Transação segura
      await prisma.$transaction(async (tx) => {
        // Cria as aulas
        for (const booking of finalBookingsToCreate) {
          await tx.lesson.create({
            data: {
              studentId: student.id,
              teacherId: booking.teacherId,
              subjectId: booking.subjectId,
              date: booking.date,
              startTime: booking.start,
              endTime: booking.end,
              status: "scheduled",
              createdBy: "system-cron",
            }
          });
        }

        // Debita os créditos
        await tx.user.update({
          where: { id: student.id },
          data: {
            credits: {
              decrement: lessonsToCreateCount
            }
          }
        });
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
