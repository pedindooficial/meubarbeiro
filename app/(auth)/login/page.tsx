"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GoogleIcon from "@/components/GoogleIcon";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Email ou senha incorretos.");
        setLoading(false);
        return;
      }
      if (res?.url) window.location.href = res.url;
      else window.location.href = callbackUrl;
    } catch {
      setError("Erro ao entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2">
              {error}
            </p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-white/50 focus:outline-none min-h-[44px]"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-white/50 focus:outline-none min-h-[44px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-500 text-sm">ou</span>
          <span className="flex-1 h-px bg-gray-600" />
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full mt-4 py-3 rounded-lg border border-gray-600 font-medium hover:bg-white/5 min-h-[44px] flex items-center justify-center gap-2"
        >
          <GoogleIcon className="shrink-0" />
          Continuar com Google
        </button>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Não tem conta?{" "}
          <Link href="/registro" className="text-white underline">
            Cadastrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center text-gray-400">Carregando…</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
