"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SelectDark from "@/components/SelectDark";

type Barbershop = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  phone?: string;
  ownerId: { name?: string; email?: string } | string;
  plan: string;
  status: string;
  addressCidade?: string;
  addressEstado?: string;
  createdAt?: string;
};

type BarbershopStats = {
  clientsCount: number;
  appointmentsCount: number;
  appointmentsCompleted: number;
};

export default function AdminBarbershopEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<Barbershop | null>(null);
  const [stats, setStats] = useState<BarbershopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"resumo" | "editar">("resumo");
  const [form, setForm] = useState({ name: "", plan: "free", status: "active" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/barbershops/${id}`).then((r) => {
        if (!r.ok) throw new Error("Não encontrado");
        return r.json();
      }),
      fetch(`/api/admin/barbershops/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([d, s]) => {
        setData(d);
        setStats(s);
        setForm({ name: d.name, plan: d.plan, status: d.status });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/barbershops/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(result.error || "Erro ao salvar");
      return;
    }
    setData(result);
    setTab("resumo");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-500">Carregando…</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-zinc-400 mb-4">Barbearia não encontrada.</p>
        <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-medium">
          ← Voltar ao painel
        </Link>
      </div>
    );
  }

  const owner = typeof data.ownerId === "object" ? data.ownerId : null;
  const planLabels: Record<string, string> = { free: "Grátis", basic: "Basic", premium: "Premium" };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        ← Voltar ao painel
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {data.logo ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
              <img src={data.logo} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl shrink-0">
              ✂️
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{data.name}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{data.slug}</p>
            {owner && (
              <p className="text-zinc-400 text-sm mt-1">
                Dono: {(owner as { email?: string }).email}
                {(owner as { name?: string }).name && ` (${(owner as { name?: string }).name})`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
              data.status === "active"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-red-500/20 text-red-300 border-red-500/40"
            }`}
          >
            {data.status === "active" ? "Ativo" : "Suspenso"}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {planLabels[data.plan] ?? data.plan}
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("resumo")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "resumo"
                ? "bg-zinc-800 text-white border border-zinc-700 border-b-zinc-800 -mb-px"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setTab("editar")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "editar"
                ? "bg-zinc-800 text-white border border-zinc-700 border-b-zinc-800 -mb-px"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            Editar
          </button>
        </div>
      </div>

      {tab === "resumo" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Métricas da barbearia</h2>
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                <p className="text-sm text-zinc-400">Clientes cadastrados</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.clientsCount}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                <p className="text-sm text-zinc-400">Total de agendamentos</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.appointmentsCount}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                <p className="text-sm text-zinc-400">Atendimentos concluídos</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.appointmentsCompleted}</p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Não foi possível carregar as métricas.</p>
          )}
          {(data.addressCidade || data.addressEstado) && (
            <div>
              <p className="text-sm text-zinc-400">Localização</p>
              <p className="text-zinc-300">
                {[data.addressCidade, data.addressEstado].filter(Boolean).join(" — ")}
              </p>
            </div>
          )}
          {data.phone && (
            <div>
              <p className="text-sm text-zinc-400">Telefone</p>
              <p className="text-zinc-300">{data.phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-zinc-400">Link do portfólio</p>
            <a
              href={`/portfolio/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-sm break-all"
            >
              /portfolio/{data.slug}
            </a>
          </div>
        </div>
      )}

      {tab === "editar" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Alterar dados</h2>
          <form onSubmit={handleSubmit} className="max-w-md space-y-4">
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">{error}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da barbearia</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                required
              />
            </div>
            <SelectDark
              label="Plano"
              value={form.plan}
              onChange={(v) => setForm((f) => ({ ...f, plan: v }))}
              options={[
                { value: "free", label: "Grátis" },
                { value: "basic", label: "Basic" },
                { value: "premium", label: "Premium" },
              ]}
            />
            <SelectDark
              label="Status"
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={[
                { value: "active", label: "Ativo" },
                { value: "suspended", label: "Suspenso" },
              ]}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {saving ? "Salvando…" : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="px-5 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
