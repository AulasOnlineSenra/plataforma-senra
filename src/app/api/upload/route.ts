// TODO: Para produção (Vercel/Cloud), migrar armazenamento para Firebase Storage ou S3.
// O armazenamento local em /public/uploads funciona apenas para instância única local.
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import { constants } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/wav",
];

export async function POST(request: NextRequest) {
  console.log('[Upload] Iniciando upload...');
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error('[Upload] Nenhum arquivo enviado');
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    }

    console.log('[Upload] Arquivo recebido:', file.name, file.size, file.type);

    if (file.size > MAX_FILE_SIZE) {
      console.error('[Upload] Arquivo muito grande:', file.size);
      return NextResponse.json(
        { success: false, error: "Arquivo excede o limite de 10MB." },
        { status: 400 },
      );
    }

    const baseType = file.type.split(";")[0];
    if (!ALLOWED_TYPES.includes(baseType)) {
      console.error('[Upload] Tipo não permitido:', baseType);
      return NextResponse.json(
        { success: false, error: "Tipo de arquivo não permitido." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    
    // Verificar se diretório existe, se não, criar
    try {
      await access(uploadDir, constants.F_OK);
      console.log('[Upload] Diretório já existe:', uploadDir);
    } catch {
      console.log('[Upload] Criando diretório:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/chat/${fileName}`;
    console.log('[Upload] Arquivo salvo com sucesso:', url);

    return NextResponse.json({
      success: true,
      data: {
        url,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("[Upload] Erro no upload:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar upload." },
      { status: 500 },
    );
  }
}
