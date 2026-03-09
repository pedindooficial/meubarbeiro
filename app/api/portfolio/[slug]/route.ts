import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Barbershop from "@/lib/models/Barbershop";
import PortfolioItem from "@/lib/models/PortfolioItem";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await connectDB();

  const barbershop = await Barbershop.findOne({ slug, status: "active" })
    .select("name slug logo phone addressLogradouro addressNumero addressComplemento addressBairro addressCidade addressEstado addressCep settings")
    .lean() as {
      _id: unknown; name: string; slug: string; logo?: string; phone?: string;
      addressLogradouro?: string; addressNumero?: string; addressComplemento?: string;
      addressBairro?: string; addressCidade?: string; addressEstado?: string; addressCep?: string;
    } | null;

  if (!barbershop) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });
  }

  const parts = [
    [barbershop.addressLogradouro, barbershop.addressNumero].filter(Boolean).join(", "),
    barbershop.addressComplemento,
    barbershop.addressBairro,
    [barbershop.addressCidade, barbershop.addressEstado].filter(Boolean).join(" - "),
    barbershop.addressCep,
  ].filter(Boolean);
  const addressFormatted = parts.length > 0 ? parts.join(" · ") : null;

  const items = await PortfolioItem.find({
    tenantId: barbershop._id,
    active: { $ne: false },
  })
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    barbershop: {
      name: barbershop.name,
      slug: barbershop.slug,
      logo: barbershop.logo ?? null,
      phone: barbershop.phone ?? null,
      address: addressFormatted,
    },
    items,
  });
}
