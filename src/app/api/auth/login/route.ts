import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/app/actions/auth";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Emite o cookie HttpOnly com userId e role
    await setSessionCookie({
      userId: result.user.id,
      role: result.user.role,
    });

    // Retorna dados do usuário SEM senha (já sanitizado no loginUser)
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("[API/auth/login] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
