"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getScheduleStructure(userId: string) {
  try {
    const structure = await prisma.scheduleStructure.findMany({
      where: { userId },
    });
    return { success: true, data: structure };
  } catch (error: any) {
    console.error("Error fetching schedule structure:", error);
    return { success: false, error: error.message };
  }
}

export async function createScheduleBlock(data: {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: string;
  color?: string;
}) {
  try {
    const block = await prisma.scheduleStructure.create({
      data,
    });
    revalidatePath("/dashboard/cronograma");
    return { success: true, data: block };
  } catch (error: any) {
    console.error("Error creating schedule block:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteScheduleBlock(id: string) {
  try {
    await prisma.scheduleStructure.delete({
      where: { id },
    });
    revalidatePath("/dashboard/cronograma");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting schedule block:", error);
    return { success: false, error: error.message };
  }
}

export async function updateScheduleBlock(id: string, data: { dayOfWeek: number, startTime: string, endTime: string }) {
  try {
    const block = await prisma.scheduleStructure.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/cronograma");
    return { success: true, data: block };
  } catch (error: any) {
    console.error("Error updating schedule block:", error);
    return { success: false, error: error.message };
  }
}


export async function checkScheduleAvailability(
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeBlockId?: string
) {
  try {
    const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    // Tolerância silenciosa de 2 minutos para bordas coladas
    const reqStart = timeToMin(startTime) + 2;
    const reqEnd = timeToMin(endTime) - 2;

    // 1. Check teacher's configured availability
    const availabilities = await prisma.availability.findMany({
      where: { teacherId, dayOfWeek }
    });

    const isAvailable = availabilities.some(a => {
      const aStart = timeToMin(a.startTime);
      const aEnd = timeToMin(a.endTime);
      return aStart <= reqStart && aEnd >= reqEnd;
    });

    if (!isAvailable) {
      const slots = availabilities.map(a => `${a.startTime} às ${a.endTime}`).join(", ");
      return { 
        available: false, 
        error: "Professor não atende neste horário.",
        availableSlots: slots ? `Horários disponíveis neste dia: ${slots}` : 'Não atende neste dia.'
      };
    }

    // 2. Check for conflicts with other students' schedule blocks
    const existingBlocks = await prisma.scheduleStructure.findMany({
      where: {
        teacherId,
        dayOfWeek,
        id: excludeBlockId ? { not: excludeBlockId } : undefined
      }
    });

    const hasConflict = existingBlocks.some(b => {
      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);
      return bStart < reqEnd && bEnd > reqStart; // Overlap condition
    });

    if (hasConflict) {
      return { available: false, error: "Professor já possui aula marcada com outro aluno neste horário." };
    }

    return { available: true };
  } catch (error: any) {
    console.error("Error checking availability:", error);
    return { available: false, error: "Erro ao verificar disponibilidade." };
  }
}

export async function getTeacherAvailabilityGrid(teacherId: string) {
  try {
    const availabilities = await prisma.availability.findMany({
      where: { teacherId }
    });
    const existingBlocks = await prisma.scheduleStructure.findMany({
      where: { teacherId }
    });
    return { success: true, availabilities, existingBlocks };
  } catch (error: any) {
    console.error("Error fetching teacher availability grid:", error);
    return { success: false, error: error.message };
  }
}
