"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleIcon from "@/components/GoogleIcon";

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [barbershopName, setBarbershopName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          barbershopName: barbershopName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao cadastrar");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(true);
      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      setLoading(false);
      if (signInResult?.url) {
        window.location.href = signInResult.url;
        return;
      }
      if (signInResult?.error) {
        setError("Conta criada. Faça login com seu email e senha.");
        setSuccess(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (success && loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-green-400 mb-4">Conta criada! Entrando…</p>
          <p className="text-gray-500 text-sm">Redirecionando para o dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastrar</h1>
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
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-white/50 focus:outline-none min-h-[44px]"
          />
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-white/50 focus:outline-none min-h-[44px]"
          />
          <input
            type="text"
            placeholder="Nome da barbearia"
            value={barbershopName}
            onChange={(e) => setBarbershopName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-white/50 focus:outline-none min-h-[44px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-500 text-sm">ou</span>
          <span className="flex-1 h-px bg-gray-600" />
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full mt-4 py-3 rounded-lg border border-gray-600 font-medium hover:bg-white/5 min-h-[44px] flex items-center justify-center gap-2"
        >
          <GoogleIcon className="shrink-0" />
          Continuar com Google
        </button>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="text-white underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
