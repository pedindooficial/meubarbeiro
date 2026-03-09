import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/api-auth";
import { put } from "@vercel/blob";

const MAX_SIZE_MB = 4;
const MAX_SIZE_BASE64_MB = 2; // base64 no MongoDB: menor para não estourar documento
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." },
      { status: 400 }
    );
  }

  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const maxBytes = useBlob ? MAX_SIZE_MB * 1024 * 1024 : MAX_SIZE_BASE64_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: useBlob ? `Arquivo muito grande. Máximo ${MAX_SIZE_MB} MB.` : `Sem Blob configurado: máximo ${MAX_SIZE_BASE64_MB} MB para salvar no banco.` },
      { status: 400 }
    );
  }

  // Com Vercel Blob: melhor desempenho (CDN)
  if (useBlob) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const type = (formData.get("type") as string) || "portfolio";
    const pathname =
      type === "logo"
        ? `barbershop/${auth.tenantId}/logo-${Date.now()}.${ext}`
        : `portfolio/${auth.tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    try {
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("Upload error:", err);
      return NextResponse.json(
        { error: "Falha ao fazer upload da imagem" },
        { status: 500 }
      );
    }
  }

  // Fallback: base64 no MongoDB (funciona sem config, sem 503)
  try {
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    console.error("Base64 error:", err);
    return NextResponse.json(
      { error: "Falha ao processar a imagem" },
      { status: 500 }
    );
  }
}
