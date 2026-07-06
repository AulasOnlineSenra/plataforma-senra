import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import { constants } from "fs";
import { bucket } from "@/lib/firebase-admin";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 2MB

// MIME Types e Extensões permitidas (Whitelist de Segurança)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // 1. Validação de Tamanho (2MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: `Máximo ${MAX_FILE_SIZE_MB}MB. Comprima seu arquivo e tente novamente: https://www.ilovepdf.com/pt` 
      }, { status: 400 });
    }

    // 2. Validação de MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: "Tipo de arquivo não permitido. Envie apenas imagens (JPG, PNG, WEBP) ou PDF." 
      }, { status: 400 });
    }

    // 3. Validação de Extensão dupla checagem (Prevenção contra bypass de MIME Type)
    const fileNameLower = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
    if (!hasAllowedExtension) {
      return NextResponse.json({ 
        success: false, 
        error: "Extensão de arquivo inválida. Apenas imagens ou PDF são aceitos." 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // USANDO FIREBASE STORAGE (Ideal para Vercel)
    if (process.env.FIREBASE_PROJECT_ID) {
      try {
        console.log("[Upload] Usando Firebase Storage...");
        
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const firebaseFile = bucket.file(`uploads/chat/${fileName}`);

        await firebaseFile.save(buffer, {
          metadata: {
            contentType: file.type,
          },
        });

        // Omitir makePublic() pois o Firebase Storage via GCP costuma bloquear isso
        // Vamos gerar a URL padrão de leitura do Firebase Storage
        const encodedPath = encodeURIComponent(`uploads/chat/${fileName}`);
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        return NextResponse.json({
          success: true,
          data: {
            url: publicUrl,
            name: file.name,
            type: file.type,
            size: file.size,
          },
        });
      } catch (fbError) {
        console.error("[Upload] Falha no Firebase, caindo para armazenamento local:", fbError);
        // Continua para o fallback local abaixo
      }
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
        url: `/api/uploads/chat/${fileName}`,
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
