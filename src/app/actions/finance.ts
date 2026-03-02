'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getStudentTransactions(studentId: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Erro ao buscar transacoes do aluno:', error);
    return { success: false, error: 'Falha ao carregar historico de compras.' };
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
    return { success: false, error: 'Falha ao registrar transacao.' };
  }
}
