'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

type SettingsInput = {
  whatsapp: string;
  classValue: string;
  referralBonus: string;
};

export async function getSettings() {
  try {
    let settings = await prisma.appSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.appSetting.create({
        data: { id: 'global' },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error('Erro ao buscar configuracoes:', error);
    return { success: false, error: 'Falha ao buscar configurações do sistema.' };
  }
}

export async function updateSettings(data: SettingsInput) {
  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        whatsapp: data.whatsapp.trim(),
        classValue: data.classValue.trim(),
        referralBonus: data.referralBonus.trim(),
      },
      update: {
        whatsapp: data.whatsapp.trim(),
        classValue: data.classValue.trim(),
        referralBonus: data.referralBonus.trim(),
      },
    });

    revalidatePath('/dashboard/admin/settings');
    revalidatePath('/dashboard/packages');

    return { success: true, data: settings };
  } catch (error) {
    console.error('Erro ao atualizar configuracoes:', error);
    return { success: false, error: 'Falha ao atualizar configurações do sistema.' };
  }
}
