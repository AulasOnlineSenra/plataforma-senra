import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import { constants } from "fs";
import { bucket } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Arquivo muito grande (máx 15MB)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // USANDO FIREBASE STORAGE (Ideal para Vercel)
    if (process.env.FIREBASE_PROJECT_ID) {
      console.log("[Upload] Usando Firebase Storage...");
      
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const firebaseFile = bucket.file(`uploads/chat/${fileName}`);

      await firebaseFile.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Tornar o arquivo público (opcional, dependendo das regras do bucket)
      // Se o bucket não for público, você precisará usar getSignedUrl
      await firebaseFile.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;

      return NextResponse.json({
        success: true,
        data: {
          url: publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });
    }

    // FALLBACK LOCAL (Apenas para teste em localhost, falha no Vercel)
    console.log("[Upload] Firebase não configurado, usando fallback local...");
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");

    try {
      await access(uploadDir, constants.F_OK);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        url: `/uploads/chat/${fileName}`,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });

  } catch (error: any) {
    console.error("[Upload] Erro crítico:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro no upload. No Vercel, você precisa configurar o Firebase no .env para funcionar.",
      details: error.message 
    }, { status: 500 });
  }
}
