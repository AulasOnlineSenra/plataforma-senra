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
