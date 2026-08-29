'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateScrapingUrl(vestibularId: string, url: string) {
  try {
    await prisma.vestibular.update({
      where: { id: vestibularId },
      data: { scrapingUrl: url.trim() }
    });
    revalidatePath('/dashboard/admin/calendario');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
