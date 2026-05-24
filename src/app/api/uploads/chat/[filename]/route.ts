import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await context.params;
    
    // Prevent directory traversal attacks
    if (filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", "chat", filename);
    const buffer = await readFile(filePath);
    
    // Determine content type
    let contentType = "application/octet-stream";
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "svg") contentType = "image/svg+xml";
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("Error serving local file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
