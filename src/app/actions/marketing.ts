'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

type MarketingCostInput = {
  ads: number;
  team: number;
  organicCommissions: number;
  paidCommissions: number;
};

export async function getMarketingCosts(month: string) {
  try {
    const existing = await prisma.marketingCost.findUnique({
      where: { month },
    });

    if (!existing) {
      return {
        success: true,
        data: {
          month,
          ads: 0,
          team: 0,
          organicCommissions: 0,
          paidCommissions: 0,
        },
      };
    }

    return { success: true, data: existing };
  } catch (error) {
    console.error('Erro ao buscar custos de marketing:', error);
    return { success: false, error: 'Falha ao buscar custos de marketing.' };
  }
}

export async function saveMarketingCosts(month: string, data: MarketingCostInput) {
  try {
    const saved = await prisma.marketingCost.upsert({
      where: { month },
      create: {
        month,
        ads: Number(data.ads) || 0,
        team: Number(data.team) || 0,
        organicCommissions: Number(data.organicCommissions) || 0,
        paidCommissions: Number(data.paidCommissions) || 0,
      },
      update: {
        ads: Number(data.ads) || 0,
        team: Number(data.team) || 0,
        organicCommissions: Number(data.organicCommissions) || 0,
        paidCommissions: Number(data.paidCommissions) || 0,
      },
    });

    revalidatePath('/dashboard/marketing');

    return { success: true, data: saved };
  } catch (error) {
    console.error('Erro ao salvar custos de marketing:', error);
    return { success: false, error: 'Falha ao salvar custos de marketing.' };
  }
}
