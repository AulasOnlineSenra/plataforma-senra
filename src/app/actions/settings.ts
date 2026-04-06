'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

type SettingsInput = {
  whatsapp: string;
  classValue: string;
  referralBonus: string;
  pixKey?: string;
  pixKeyType?: string;
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
        pixKey: (data.pixKey ?? '').trim(),
        pixKeyType: (data.pixKeyType ?? 'cnpj').trim(),
      },
      update: {
        whatsapp: data.whatsapp.trim(),
        classValue: data.classValue.trim(),
        referralBonus: data.referralBonus.trim(),
        pixKey: (data.pixKey ?? '').trim(),
        pixKeyType: (data.pixKeyType ?? 'cnpj').trim(),
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

// Atualizar tipo de disponibilidade global (ex: "weekly" ou "custom")
export async function updateAvailabilityType(availabilityType: string) {
  try {
    const trimmed = availabilityType.trim();
    if (!trimmed) {
      return { success: false, error: 'Tipo de disponibilidade inválido.' };
    }

    const settings = await prisma.appSetting.upsert({
      where: { id: 'global' },
      create: { id: 'global', availabilityType: trimmed },
      update: { availabilityType: trimmed },
    });

    revalidatePath('/dashboard/admin/settings');

    return { success: true, data: settings };
  } catch (error) {
    console.error('Erro ao atualizar tipo de disponibilidade:', error);
    return { success: false, error: 'Falha ao atualizar tipo de disponibilidade.' };
  }
}
