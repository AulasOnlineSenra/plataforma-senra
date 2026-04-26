'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Buscar todos os planos
export async function getPlans() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' } // Do mais barato para o mais caro
    });
    return { success: true, data: plans };
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return { success: false, error: 'Falha ao buscar planos do banco de dados.' };
  }
}

// 2. Criar um novo plano
export async function createPlan(data: {
  name: string;
  lessonsCount: number;
  price: number;
  durationMins: number;
  isPopular: boolean;
  features?: string[];
}) {
  try {
    const newPlan = await prisma.plan.create({
      data: {
        name: data.name,
        lessonsCount: data.lessonsCount,
        price: data.price,
        durationMins: data.durationMins,
        isPopular: data.isPopular,
        features: JSON.stringify(data.features || []),
      }
    });
    
    // Avisa o Next.js para atualizar a tela de planos
    revalidatePath('/dashboard/plans'); 
    
    return { success: true, data: newPlan };
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return { success: false, error: 'Falha ao salvar o plano no banco.' };
  }
}

// 3. Deletar um plano
export async function deletePlan(id: string) {
  try {
    await prisma.plan.delete({
      where: { id }
    });
    revalidatePath('/dashboard/plans');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar plano:', error);
    return { success: false, error: 'Não foi possível deletar o pacote.' };
  }
}

// 4. Atualizar um plano
export async function updatePlan(id: string, data: {
  name: string;
  lessonsCount: number;
  price: number;
  durationMins: number;
  isPopular: boolean;
  features?: string[];
}) {
  try {
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        lessonsCount: data.lessonsCount,
        price: data.price,
        durationMins: data.durationMins,
        isPopular: data.isPopular,
        features: data.features ? JSON.stringify(data.features) : undefined,
      }
    });
    
    revalidatePath('/dashboard/plans');
    
    return { success: true, data: updatedPlan };
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return { success: false, error: 'Falha ao atualizar o plano no banco.' };
  }
}