import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "./models/User";
import Barbershop from "./models/Barbershop";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 30);
}

async function ensureBarbershopForUser(userId: string, name: string) {
  await connectDB();
  const existing = await Barbershop.findOne({ ownerId: userId });
  if (existing) return existing._id.toString();
  const baseSlug = generateSlug(name || "minha-barbearia");
  let slug = baseSlug;
  let counter = 0;
  while (await Barbershop.findOne({ slug })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  const barbershop = await Barbershop.create({
    name: name || "Minha Barbearia",
    slug,
    ownerId: userId,
    plan: "free",
  });
  return barbershop._id.toString();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        let tenantId = user.tenantId?.toString();
        if (!tenantId && user.role === "barber") {
          tenantId = await ensureBarbershopForUser(user._id.toString(), user.name || "Barbearia");
          await User.updateOne({ _id: user._id }, { tenantId });
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          tenantId: tenantId ?? null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          dbUser = await User.create({
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            role: "barber",
            emailVerified: new Date(),
          });
        }
        if (!dbUser.tenantId && dbUser.role === "barber") {
          const tenantId = await ensureBarbershopForUser(
            dbUser._id.toString(),
            dbUser.name || user.name || "Barbearia"
          );
          await User.updateOne({ _id: dbUser._id }, { tenantId });
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
        token.tenantId = (user as { tenantId?: string | null }).tenantId;
      }
      if (account?.provider === "google" && user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId?.toString() ?? null;
        }
      }
      if (trigger === "update" && session) {
        token.tenantId = (session as { tenantId?: string }).tenantId ?? token.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { tenantId?: string | null }).tenantId = token.tenantId as string | null;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  events: {},
};
