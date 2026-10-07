"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import unbCutoffs from "@/lib/unb-cutoffs.json";

export async function submitPasLead(data: {
  studentName: string;
  studentWhatsapp: string;
  parentName: string;
  parentWhatsapp: string;
  school?: string;
  gradeStage: string;
  targetCourse: string;
  pas1Score?: number;
  pas2Score?: number;
  essayTarget?: number;
}) {
  try {
    // 1. Encontrar a nota de corte do curso alvo
    const cutoffInfo = unbCutoffs.find((c) => c.course === data.targetCourse) || { cutoff: 60 };
    const notaCorte = cutoffInfo.cutoff;

    // 2. Calcular o EF Projetado (Escore Final)
    // Formula: EF = (EA1 * 1 + EA2 * 2 + EA3 * 3) / 6
    const ea1 = data.pas1Score || 0;
    const ea2 = data.pas2Score || 0;
    // Assuming essay is included in the EA somehow, or we just project EA3 based on their target
    // We'll estimate what they need on PAS 3 to reach the cutoff:
    // EF_needed = cutoff
    // 6 * cutoff = EA1 + 2*EA2 + 3*EA3
    // EA3_needed = (6 * cutoff - EA1 - 2*EA2) / 3
    
    // For the sake of the projected EF if they keep the same average:
    const avgCurrent = (ea1 + ea2) / 2 || 0;
    const projectedEa3 = avgCurrent > 0 ? avgCurrent : 50; 
    const projectedEf = (ea1 * 1 + ea2 * 2 + projectedEa3 * 3) / 6;

    // 3. Determinar Zona de Risco
    let riskZone = "RED";
    if (projectedEf >= notaCorte * 1.05) {
      riskZone = "GREEN";
    } else if (projectedEf >= notaCorte * 0.95) {
      riskZone = "YELLOW";
    }

    // 4. Salvar no banco
    const lead = await prisma.pasUnbLead.create({
      data: {
        studentName: data.studentName,
        studentWhatsapp: data.studentWhatsapp,
        parentName: data.parentName,
        parentWhatsapp: data.parentWhatsapp,
        school: data.school || "",
        gradeStage: data.gradeStage,
        targetCourse: data.targetCourse,
        pas1Score: data.pas1Score,
        pas2Score: data.pas2Score,
        essayTarget: data.essayTarget,
        projectedEf,
        riskZone,
        leadStatus: "NOVO"
      }
    });

    return { success: true, lead, projectedEf, riskZone, cutoff: notaCorte };
  } catch (error) {
    console.error("Erro ao salvar lead do PAS:", error);
    return { success: false, error: "Falha ao processar simulação." };
  }
}

export async function getPasLeads() {
  try {
    const leads = await prisma.pasUnbLead.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, leads };
  } catch (error) {
    console.error("Erro ao buscar leads do PAS:", error);
    return { success: false, error: "Falha ao buscar leads." };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    await prisma.pasUnbLead.update({
      where: { id },
      data: { leadStatus: status }
    });
    revalidatePath("/dashboard/admin/leads-pas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);
    return { success: false, error: "Falha ao atualizar status." };
  }
}
