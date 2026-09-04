'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

type SettingsInput = {
  whatsapp: string;
  classValue: string;
  referralBonus: string;
  referralDiscountPercent?: string;
  pixKey?: string;
  pixKeyType?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openRouterApiKey?: string;
  minimaxApiKey?: string;
  grokApiKey?: string;
  searchApiKey?: string;
  backupAuto?: boolean;
  backupFrequency?: string;
  backupRetention?: number;
  backupEmail?: string;
  backupDrive?: string;
  referralModalEnabled?: boolean;
  referralModalFrequency?: string;
  referralModalMaxVisits?: number;
  referralModalMaxDays?: number;
  referralModalImages?: string;
  contactEmail?: string;
  contactInstagram?: string;
  contactSite?: string;
  scraperRequiresApproval?: boolean;
  scraperFrequency?: string;
};

export async function getSettings() {
  try {
    let settings = await prisma.appSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.appSetting.create({
        data: { id: 'global', updatedAt: new Date() },
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
    const referralDiscountPercent = data.referralDiscountPercent?.trim() ? data.referralDiscountPercent.trim() : '0';
    
    console.log('[updateSettings] Valores a serem salvos:', { classValue, whatsapp, referralBonus, referralDiscountPercent });
    
    const now = new Date();
    
    const settings = await prisma.appSetting.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        whatsapp: whatsapp,
        classValue: classValue,
        referralBonus: referralBonus,
        referralDiscountPercent: referralDiscountPercent,
        pixKey: data.pixKey?.trim() || '',
        pixKeyType: data.pixKeyType?.trim() || 'cnpj',
        geminiApiKey: data.geminiApiKey?.trim() || null,
        openaiApiKey: data.openaiApiKey?.trim() || null,
        anthropicApiKey: data.anthropicApiKey?.trim() || null,
        openRouterApiKey: data.openRouterApiKey?.trim() || null,
        minimaxApiKey: data.minimaxApiKey?.trim() || null,
        grokApiKey: data.grokApiKey?.trim() || null,
        searchApiKey: data.searchApiKey?.trim() || null,
        backupAuto: data.backupAuto ?? false,
        backupFrequency: data.backupFrequency || 'weekly',
        backupRetention: data.backupRetention || 5,
        backupEmail: data.backupEmail?.trim() || null,
        backupDrive: data.backupDrive?.trim() || null,
        referralModalEnabled: data.referralModalEnabled ?? true,
        referralModalFrequency: data.referralModalFrequency || 'always',
        referralModalMaxVisits: data.referralModalMaxVisits || 8,
        referralModalMaxDays: data.referralModalMaxDays || 45,
        referralModalImages: data.referralModalImages || '[]',
        contactEmail: data.contactEmail?.trim() || 'contato@aos.com.br',
        contactInstagram: data.contactInstagram?.trim() || '@senra.aulasonline',
        contactSite: data.contactSite?.trim() || 'www.senraaulasonline.com.br',
        scraperRequiresApproval: data.scraperRequiresApproval ?? true,
        scraperFrequency: data.scraperFrequency || 'weekly',
        updatedAt: now,
      },
      update: {
        whatsapp: data.whatsapp !== undefined ? whatsapp : undefined,
        classValue: data.classValue !== undefined ? classValue : undefined,
        referralBonus: data.referralBonus !== undefined ? referralBonus : undefined,
        referralDiscountPercent: data.referralDiscountPercent !== undefined ? referralDiscountPercent : undefined,
        pixKey: data.pixKey !== undefined ? (data.pixKey?.trim() || '') : undefined,
        pixKeyType: data.pixKeyType !== undefined ? (data.pixKeyType?.trim() || 'cnpj') : undefined,
        geminiApiKey: data.geminiApiKey !== undefined ? (data.geminiApiKey?.trim() || null) : undefined,
        openaiApiKey: data.openaiApiKey !== undefined ? (data.openaiApiKey?.trim() || null) : undefined,
        anthropicApiKey: data.anthropicApiKey !== undefined ? (data.anthropicApiKey?.trim() || null) : undefined,
        openRouterApiKey: data.openRouterApiKey !== undefined ? (data.openRouterApiKey?.trim() || null) : undefined,
        minimaxApiKey: data.minimaxApiKey !== undefined ? (data.minimaxApiKey?.trim() || null) : undefined,
        grokApiKey: data.grokApiKey !== undefined ? (data.grokApiKey?.trim() || null) : undefined,
        searchApiKey: data.searchApiKey !== undefined ? (data.searchApiKey?.trim() || null) : undefined,
        backupAuto: data.backupAuto !== undefined ? data.backupAuto : undefined,
        backupFrequency: data.backupFrequency !== undefined ? data.backupFrequency : undefined,
        backupRetention: data.backupRetention !== undefined ? data.backupRetention : undefined,
        backupEmail: data.backupEmail !== undefined ? (data.backupEmail?.trim() || null) : undefined,
        backupDrive: data.backupDrive !== undefined ? (data.backupDrive?.trim() || null) : undefined,
        referralModalEnabled: data.referralModalEnabled !== undefined ? data.referralModalEnabled : undefined,
        referralModalFrequency: data.referralModalFrequency !== undefined ? data.referralModalFrequency : undefined,
        referralModalMaxVisits: data.referralModalMaxVisits !== undefined ? data.referralModalMaxVisits : undefined,
        referralModalMaxDays: data.referralModalMaxDays !== undefined ? data.referralModalMaxDays : undefined,
        referralModalImages: data.referralModalImages !== undefined ? data.referralModalImages : undefined,
        contactEmail: data.contactEmail !== undefined ? (data.contactEmail?.trim() || null) : undefined,
        contactInstagram: data.contactInstagram !== undefined ? (data.contactInstagram?.trim() || null) : undefined,
        contactSite: data.contactSite !== undefined ? (data.contactSite?.trim() || null) : undefined,
        scraperRequiresApproval: data.scraperRequiresApproval !== undefined ? data.scraperRequiresApproval : undefined,
        scraperFrequency: data.scraperFrequency !== undefined ? data.scraperFrequency : undefined,
        updatedAt: now,
      },
    });

    revalidatePath('/dashboard/admin/settings');
    revalidatePath('/dashboard/packages');
    revalidatePath('/dashboard/financeiro');
    revalidatePath('/contato'); // Invalida o cache ISR da p\u00e1gina de contato

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

export async function getAiVisualPrompt() {
  try {
    const settings = await prisma.appSetting.findUnique({
      where: { id: 'global' },
      select: { aiVisualPrompt: true }
    });
    return { success: true, prompt: settings?.aiVisualPrompt || null };
  } catch (error) {
    console.error('Erro ao buscar aiVisualPrompt:', error);
    return { success: false, error: 'Erro ao buscar prompt' };
  }
}

export async function updateAiVisualPrompt(prompt: string) {
  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: 'global' },
      create: { id: 'global', aiVisualPrompt: prompt },
      update: { aiVisualPrompt: prompt },
    });
    revalidatePath('/dashboard/blog');
    return { success: true, prompt: settings.aiVisualPrompt };
  } catch (error) {
    console.error('Erro ao atualizar aiVisualPrompt:', error);
    return { success: false, error: 'Erro ao atualizar prompt' };
  }
}
