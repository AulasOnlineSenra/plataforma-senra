import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/auth/logout] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao encerrar sessão." },
      { status: 500 }
    );
  }
}
