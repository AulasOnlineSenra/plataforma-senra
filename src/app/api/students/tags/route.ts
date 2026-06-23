import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { studentId, tags } = await req.json();

    if (!studentId || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { tags: JSON.stringify(tags) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao atualizar tags do aluno:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao atualizar tags." },
      { status: 500 },
    );
  }
}
