"use server";

import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";
import { checkDbConnection } from "./dashboard"; // or similar, let's just do a raw prisma check
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

export async function getVpsStats() {
  try {
    // 1. Memória RAM (MB)
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    // 2. CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Desconhecido";
    const cores = cpus.length;
    // Load avg: array [1m, 5m, 15m]
    const loadAvg = os.loadavg();
    const cpuLoad1m = Math.round((loadAvg[0] / cores) * 100);
    const cpuPercentage = cpuLoad1m > 100 ? 100 : cpuLoad1m;

    // 3. Disco (Apenas no Linux/Mac)
    let diskTotal = 0;
    let diskUsed = 0;
    let diskFree = 0;
    let diskPercentage = 0;

    try {
      const { stdout } = await execAsync("df -m /");
      // Output example: 
      // Filesystem     1M-blocks  Used Available Use% Mounted on
      // /dev/sda1          50000 25000     25000  50% /
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        diskTotal = parseInt(parts[1], 10);
        diskUsed = parseInt(parts[2], 10);
        diskFree = parseInt(parts[3], 10);
        diskPercentage = parseInt(parts[4].replace("%", ""), 10);
      }
    } catch (e) {
      console.warn("Erro ao ler disco", e);
    }

    // 4. Uptime (dias)
    const uptimeSecs = os.uptime();
    const uptimeDays = Math.floor(uptimeSecs / (3600 * 24));

    // 5. Serviços
    let dbStatus = "offline";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "online";
    } catch (e) {
      console.error("Erro BD", e);
    }

    return {
      success: true,
      data: {
        memory: { total: totalMem, used: usedMem, free: freeMem, percentage: memPercentage },
        cpu: { model: cpuModel, cores, percentage: cpuPercentage },
        disk: { total: diskTotal, used: diskUsed, free: diskFree, percentage: diskPercentage },
        uptimeDays,
        services: {
          database: dbStatus,
          webserver: "online" // se essa função rodou, o next.js está vivo
        }
      }
    };
  } catch (error: any) {
    console.error("Erro ao ler status da VPS:", error);
    return { success: false, error: "Falha ao obter status." };
  }
}

export async function clearServerCache() {
  try {
    revalidatePath("/", "layout");
    // Adicionalmente podemos chamar o garbage collector se o node for iniciado com --expose-gc, mas revalidatePath já é bom.
    return { success: true, message: "Cache do Next.js limpo com sucesso!" };
  } catch (e: any) {
    return { success: false, error: e.message || "Erro ao limpar cache" };
  }
}
