import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        credits: true,
        tags: true,
        referralCode: true,
        createdAt: true,
        subject: true,
        phone: true,
        cpf: true,
        state: true,
        birthDate: true,
        cep: true,
        neighborhood: true,
        street: true,
        number: true,
        complement: true,
      },
    });

    if (!user || user.status === "inactive" || user.status === "deleted") {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[API/auth/session] Erro:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
