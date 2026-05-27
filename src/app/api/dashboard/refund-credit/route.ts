import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ success: false, error: "studentId é obrigatório." }, { status: 400 });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ success: false, error: "Aluno não encontrado." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { credits: { increment: 1 } },
    });

    return NextResponse.json({ success: true, message: "Crédito restituído com sucesso." });
  } catch (error: any) {
    console.error("[refund-credit] Erro:", error);
    return NextResponse.json({ success: false, error: "Erro ao restituir crédito." }, { status: 500 });
  }
}
