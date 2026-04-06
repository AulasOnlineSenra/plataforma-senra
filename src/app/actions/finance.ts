'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { createBookings } from './bookings';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function getStudentTransactions(studentId: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transacoes do aluno:', error);
    return { success: false, error: 'Falha ao carregar histórico de compras.' };
  }
}

export async function getStudentPendingTransactions(studentId: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { studentId, status: 'PENDENTE' },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transacoes pendentes do aluno:', error);
    return { success: false, error: 'Falha ao carregar pagamentos pendentes.' };
  }
}

export async function getAllPendingTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transações pendentes:', error);
    return { success: false, error: 'Falha ao carregar pagamentos pendentes.' };
  }
}

export async function addTransactionAndCredits(
  studentId: string,
  credits: number,
  planName: string,
  amountPaid: number,
  paymentMethod: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          studentId,
          planName,
          creditsAdded: credits,
          amountPaid,
          paymentMethod,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: studentId },
        data: {
          credits: { increment: credits },
        },
      });

      return { transaction, updatedUser };
    });

    revalidatePath('/dashboard/financeiro');
    revalidatePath('/dashboard/financial');

    return {
      success: true,
      data: {
        transaction: result.transaction,
        newCredits: result.updatedUser.credits,
      },
    };
  } catch (error) {
    console.error('Erro ao registrar transacao e adicionar creditos:', error);
    return { success: false, error: 'Falha ao registrar transação.' };
  }
}

export async function createPendingTransaction(
  studentId: string,
  credits: number,
  planName: string,
  amountPaid: number,
  paymentMethod: string,
  proofUrl?: string,
  bookings?: { subjectName: string; teacherId: string; teacherName: string; date: string; start: string; end: string }[],
) {
  console.log('[Finance] createPendingTransaction iniciado');
  console.log('[Finance] Parâmetros:', { studentId, credits, planName, amountPaid, paymentMethod, bookingsCount: bookings?.length });
  
  // Validações básicas
  if (!studentId || studentId.trim() === '') {
    console.error('[Finance] studentId inválido');
    return { success: false, error: 'ID do aluno inválido.' };
  }
  
  if (!planName || planName.trim() === '') {
    console.error('[Finance] planName inválido');
    return { success: false, error: 'Nome do plano inválido.' };
  }
  
  if (credits <= 0) {
    console.error('[Finance] credits inválido:', credits);
    return { success: false, error: 'Quantidade de créditos inválida.' };
  }
  
  if (amountPaid <= 0) {
    console.error('[Finance] amountPaid inválido:', amountPaid);
    return { success: false, error: 'Valor do pagamento inválido.' };
  }
  
  try {
    // Verificar se o aluno existe
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    });
    
    if (!student) {
      console.error('[Finance] Aluno não encontrado:', studentId);
      return { success: false, error: 'Aluno não encontrado. Faça login novamente.' };
    }
    
    console.log('[Finance] Aluno encontrado:', student.name);

    const transaction = await prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        studentId,
        planName: planName.trim(),
        creditsAdded: credits,
        amountPaid: amountPaid,
        paymentMethod: paymentMethod || 'PIX',
        status: 'PENDENTE',
        proofUrl: proofUrl || null,
        bookings: bookings && bookings.length > 0 ? JSON.stringify(bookings) : null,
      },
    });
    
    console.log('[Finance] Transação criada:', transaction.id);

    const admins = await prisma.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true },
    });
    
    console.log('[Finance] Admins encontrados:', admins.length);

    for (const admin of admins) {
      try {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: admin.id,
            type: 'payment_pending',
            title: 'Novo pagamento pendente',
            message: `Aluno ${student.name} solicitou validação de pagamento de ${credits} crédito(s).`,
            read: false,
          },
        });

        // Formatar lista de aulas se houver
        let bookingsText = "";
        if (bookings && bookings.length > 0) {
          bookingsText = "\n\n📚 Aulas solicitadas:\n" + bookings.map((b, i) => {
            const dateObj = new Date(b.date);
            const dateFormatted = format(dateObj, "dd/MM", { locale: ptBR });
            return `${i + 1}. ${b.subjectName} — Prof. ${b.teacherName} — ${dateFormatted} às ${b.start}–${b.end}`;
          }).join("\n");
        }

        const amountFormatted = amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Enviar também no CHAT do aplicativo para o administrador
        await prisma.chatMessage.create({
          data: {
            id: crypto.randomUUID(),
            senderId: studentId,
            receiverId: admin.id,
            content: `💰 *Solicitação de Pagamento*\n\nAluno: ${student.name}\nCréditos: ${credits}\nValor: ${amountFormatted}${bookingsText}`,
          }
        });
      } catch (notifyError) {
        console.warn(`[Finance] Erro ao criar notificação/chat para admin ${admin.id}:`, notifyError);
      }
    }

    revalidatePath('/dashboard/financeiro');
    revalidatePath('/dashboard/financial');
    revalidatePath('/dashboard');

    return { success: true, data: transaction };
  } catch (error: any) {
    console.error('[Finance] Erro ao criar transação pendente:', error);
    console.error('[Finance] Mensagem do erro:', error.message);
    console.error('[Finance] Código do erro:', error.code);
    return { success: false, error: `Falha ao registrar transação pendente: ${error.message}` };
  }
}

export async function getPendingTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            state: true,
          },
        },
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transações pendentes:', error);
    return { success: false, error: 'Falha ao carregar transações pendentes.' };
  }
}

export async function approveTransaction(transactionId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada.');
      }

      if (transaction.status !== 'PENDENTE') {
        throw new Error('Transação não está pendente.');
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPROVADO' },
      });

      const updatedUser = await tx.user.update({
        where: { id: transaction.studentId },
        data: {
          credits: { increment: transaction.creditsAdded },
        },
      });

      // Create notification for student
      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: transaction.studentId,
          type: 'payment_approved',
          title: 'Pagamento Aprovado!',
          message: `Seu pagamento de ${transaction.creditsAdded} crédito(s) foi aprovado. Créditos adicionados à sua conta.`,
          read: false,
        },
      });

      // Create bookings if present in transaction
      let bookingsCreated = false;
      if (transaction.bookings) {
        try {
          const bookingsData = JSON.parse(transaction.bookings) as { subjectName: string; teacherId: string; date: string; start: string; end: string }[];
          
          // Filter bookings with valid teacherId
          const validBookings = bookingsData.filter(b => b.teacherId && b.teacherId.trim() !== '');
          
          if (validBookings.length > 0) {
            const bookingsToCreate = validBookings.map((b) => {
              const start = new Date(b.date);
              const [h, m] = b.start.split(':').map(Number);
              start.setHours(h, m, 0, 0);
              const end = new Date(b.date);
              const [endH, endM] = b.end.split(':').map(Number);
              end.setHours(endH, endM, 0, 0);
              
              return {
                subjectId: b.subjectName,
                teacherId: b.teacherId,
                start,
                end,
                isExperimental: false,
              };
            });

            // Call createBookings outside transaction (it handles its own transaction)
            await createBookings(transaction.studentId, bookingsToCreate, true, tx);
            bookingsCreated = true;
          } else {
            console.log('[Finance] Bookings ignorados - teacherId vazio');
          }
        } catch (parseError) {
          console.error('Erro ao processar bookings da transação:', parseError);
        }
      }

      return { updatedTransaction, updatedUser, bookingsCreated };
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/minhas-aulas');
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/admin/payments');

    return {
      success: true,
      data: {
        transaction: result.updatedTransaction,
        newCredits: result.updatedUser.credits,
        bookingsCreated: result.bookingsCreated,
      },
    };
  } catch (error: any) {
    console.error('[Approve Error]', error);
    return { success: false, error: `Falha ao aprovar: ${error.message || 'Erro desconhecido'}` };
  }
}

export async function rejectTransaction(transactionId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada.');
      }

      if (transaction.status !== 'PENDENTE') {
        throw new Error('Transação não está pendente.');
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'CANCELADO' },
      });

      // Create notification for student
      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: transaction.studentId,
          type: 'payment_rejected',
          title: 'Pagamento Rejeitado',
          message: `Seu pagamento de ${transaction.creditsAdded} crédito(s) foi rejeitado. Entre em contato com o suporte para mais informações.`,
          read: false,
        },
      });

      return { updatedTransaction };
    });

    revalidatePath('/dashboard');

    return { success: true, data: result.updatedTransaction };
  } catch (error: any) {
    console.error('[Reject Error]', error);
    return { success: false, error: `Falha ao rejeitar: ${error.message || 'Erro desconhecido'}` };
  }
}

export async function getTransactionById(transactionId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return { success: false, error: 'Falha ao carregar transação.' };
  }
}

export async function requestTransactionReview(
  transactionId: string,
  proofUrl?: string,
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, studentId: true, creditsAdded: true, planName: true },
    });

    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }

    if (transaction.status !== 'CANCELADO') {
      return { success: false, error: 'Apenas transações rejeitadas podem ser revisadas.' };
    }

    const updateData: any = { status: 'PENDENTE' };
    if (proofUrl) {
      updateData.proofUrl = proofUrl;
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });

    const student = await prisma.user.findUnique({
      where: { id: transaction.studentId },
      select: { name: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'payment_review',
          title: 'Revisão de pagamento solicitada',
          message: `Aluno ${student?.name || 'Desconhecido'} solicitou revisão do pagamento de ${transaction.creditsAdded} crédito(s) - ${transaction.planName}.`,
          read: false,
        },
      });
    }

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Erro ao solicitar revisão:', error);
    return { success: false, error: 'Falha ao solicitar revisão.' };
  }
}

export async function getApprovedTransactions(month?: string) {
  try {
    const where: any = { status: 'COMPROVADO' };
    
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);
      
      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transações aprovadas:', error);
    return { success: false, error: 'Falha ao carregar transações aprovadas.' };
  }
}

export async function getCompletedClassesByPeriod(startDate: Date, endDate: Date) {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        status: 'COMPLETED',
        date: {
          gte: startDate,
          lte: endDate,
        },
        isExperimental: false,
      },
      include: {
        teacher: {
          select: { id: true, name: true, avatarUrl: true },
        },
        student: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error('Erro ao buscar aulas concluídas:', error);
    return { success: false, error: 'Falha ao carregar aulas concluídas.' };
  }
}

export async function deleteTransaction(transactionId: string, removeCredits: boolean = true) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id: transactionId },
      });

      if (removeCredits) {
        const updatedUser = await tx.user.update({
          where: { id: transaction.studentId },
          data: {
            credits: { decrement: transaction.creditsAdded },
          },
        });
        return { updatedUser };
      }

      return { updatedUser: null };
    });

    revalidatePath('/dashboard/financeiro');
    revalidatePath('/dashboard/financial');

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return { success: false, error: 'Falha ao excluir transação.' };
  }
}
