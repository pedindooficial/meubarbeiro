import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Barbershop from "@/lib/models/Barbershop";

export const dynamic = "force-dynamic";

const DEFAULTS_NAMES = ["Minha Barbearia", "Barbearia"];

function isProfileComplete(doc: { name?: string; logo?: string } | null): boolean {
  if (!doc?.name?.trim()) return false;
  if (DEFAULTS_NAMES.includes(doc.name.trim())) return false;
  if (!doc.logo?.trim()) return false;
  return true;
}

export async function GET() {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const doc = await Barbershop.findById(auth.tenantId)
    .select("name slug plan logo phone addressLogradouro addressNumero addressComplemento addressBairro addressCidade addressEstado addressCep settings")
    .lean() as {
      name: string; slug: string; plan: string; logo?: string; phone?: string;
      addressLogradouro?: string; addressNumero?: string; addressComplemento?: string;
      addressBairro?: string; addressCidade?: string; addressEstado?: string; addressCep?: string;
    } | null;
  if (!doc) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json({
    ...doc,
    profileComplete: isProfileComplete(doc),
  });
}

export async function PUT(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.logo === "string") update.logo = body.logo.trim() || undefined;
  if (typeof body.phone === "string") update.phone = body.phone.trim() || undefined;
  const addrKeys = ["addressLogradouro", "addressNumero", "addressComplemento", "addressBairro", "addressCidade", "addressEstado", "addressCep"] as const;
  for (const key of addrKeys) {
    if (typeof body[key] === "string") update[key] = body[key].trim() || undefined;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }
  const doc = await Barbershop.findByIdAndUpdate(
    auth.tenantId,
    { $set: update },
    { new: true }
  )
    .select("name slug plan logo phone addressLogradouro addressNumero addressComplemento addressBairro addressCidade addressEstado addressCep")
    .lean();
  if (!doc) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json(doc);
}
