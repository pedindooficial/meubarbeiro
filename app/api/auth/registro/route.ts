import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Barbershop from "@/lib/models/Barbershop";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  barbershopName: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, name, barbershopName } = parsed.data;

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      name: name || null,
      role: "barber",
    });

    const slugBase = (barbershopName || name || "minha-barbearia")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 30);
    let slug = slugBase;
    let n = 0;
    while (await Barbershop.findOne({ slug })) {
      n++;
      slug = `${slugBase}-${n}`;
    }

    const barbershop = await Barbershop.create({
      name: barbershopName || name || "Minha Barbearia",
      slug,
      ownerId: user._id,
      plan: "free",
    });

    await User.updateOne({ _id: user._id }, { tenantId: barbershop._id });

    return NextResponse.json({
      ok: true,
      message: "Conta criada. Faça login.",
    });
  } catch (e) {
    console.error(e);
    const isMongoConnection =
      e instanceof Error &&
      (e.name === "MongooseServerSelectionError" || e.message?.includes("connect"));
    if (isMongoConnection) {
      return NextResponse.json(
        {
          error:
            "Não foi possível conectar ao banco de dados. Verifique o IP no MongoDB Atlas (Network Access) e se a conexão está correta.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao cadastrar" }, { status: 500 });
  }
}
