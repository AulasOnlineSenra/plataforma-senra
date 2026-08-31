'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getVestibularesWithEvents() {
  try {
    const vestibulares = await prisma.vestibular.findMany({
      where: { isActive: true },
      include: {
        events: {
          where: { status: 'APPROVED' },
          orderBy: { dateStart: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: vestibulares };
  } catch (error) {
    console.error('Erro ao buscar vestibulares:', error);
    return { success: false, error: 'Falha ao buscar calendário de vestibulares.' };
  }
}
