import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function getTenantId(): Promise<{ tenantId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenantId = (session.user as { tenantId?: string | null }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 403 });
  }
  return { tenantId };
}

export async function requireAdmin(): Promise<{ ok: true } | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return { ok: true };
}
