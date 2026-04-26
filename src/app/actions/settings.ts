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
  console.log('[updateSettings] Recebendo dados:', data);
   
  try {
    const classValue = data.classValue?.trim() ? data.classValue.trim() : '50.00';
    const whatsapp = data.whatsapp?.trim() ? data.whatsapp.trim() : '';
    const referralBonus = data.referralBonus?.trim() ? data.referralBonus.trim() : '1';
    
    console.log('[updateSettings] Valores a serem salvos:', { classValue, whatsapp, referralBonus });
    
    const now = new Date();
    
    const settings = await prisma.appSetting.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        whatsapp: whatsapp,
        classValue: classValue,
        referralBonus: referralBonus,
        pixKey: data.pixKey?.trim() || '',
        pixKeyType: data.pixKeyType?.trim() || 'cnpj',
        updatedAt: now,
      },
      update: {
        whatsapp: whatsapp,
        classValue: classValue,
        referralBonus: referralBonus,
        pixKey: data.pixKey?.trim() || '',
        pixKeyType: data.pixKeyType?.trim() || 'cnpj',
        updatedAt: now,
      },
    });

    revalidatePath('/dashboard/admin/settings');
    revalidatePath('/dashboard/packages');
    revalidatePath('/dashboard/financeiro');

    console.log('[updateSettings] Configurações salvas:', settings);
    return { success: true, data: settings };
  } catch (error: any) {
    console.error('[updateSettings] Erro completo:', error);
    const errorMessage = error?.message || error?.cause?.message || 'Erro desconhecido';
    return { success: false, error: `Falha ao atualizar configurações: ${errorMessage}` };
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
