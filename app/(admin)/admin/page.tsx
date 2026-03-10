"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Barbershop = {
  _id: string;
  name: string;
  slug: string;
  ownerId: { name?: string; email?: string } | string;
  plan: string;
  status: string;
  createdAt: string;
};

type Stats = {
  totalBarbershops: number;
  byPlan: Record<string, number>;
  totalUsers?: number;
  newBarbershopsLast7Days?: number;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Grátis",
  basic: "Basic",
  premium: "Premium",
};

const PLAN_STYLES: Record<string, string> = {
  free: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
  basic: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  premium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  suspended: "bg-red-500/20 text-red-300 border-red-500/40",
};

export default function AdminPage() {
  const [list, setList] = useState<Barbershop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/barbershops").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ])
      .then(([barbershops, s]) => {
        setList(Array.isArray(barbershops) ? barbershops : []);
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return list.filter((b) => {
      const ownerEmail = typeof b.ownerId === "object" && b.ownerId ? (b.ownerId as { email?: string }).email ?? "" : "";
      const ownerName = typeof b.ownerId === "object" && b.ownerId ? (b.ownerId as { name?: string }).name ?? "" : "";
      const matchSearch =
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase()) ||
        ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
        ownerName.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || b.plan === planFilter;
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [list, search, planFilter, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Visão geral
        </h1>
        <p className="text-zinc-400 mt-1">
          Monitoramento e gestão de todas as barbearias do sistema.
        </p>
      </div>

      {/* Cards de métricas */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm font-medium text-zinc-400">Total de barbearias</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalBarbershops}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm font-medium text-zinc-400">Novas (7 dias)</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.newBarbershopsLast7Days ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm font-medium text-zinc-400">Usuários cadastrados</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers ?? 0}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm font-medium text-zinc-400">Por plano</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.byPlan || {}).map(([plan, count]) => (
                <span
                  key={plan}
                  className={`text-xs font-medium px-2 py-0.5 rounded border ${PLAN_STYLES[plan] ?? "bg-zinc-700/50 text-zinc-300"}`}
                >
                  {PLAN_LABELS[plan] ?? plan}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de barbearias */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Barbearias</h2>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Buscar por nome, slug ou dono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">Todos os planos</option>
              <option value="free">Grátis</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Carregando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Barbearia
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Dono
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b._id}
                    className="border-b border-zinc-800/80 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-white">{b.name}</p>
                        <p className="text-sm text-zinc-500">{b.slug}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-zinc-300 text-sm">
                        {typeof b.ownerId === "object" && b.ownerId
                          ? (b.ownerId as { email?: string }).email ?? "-"
                          : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border ${PLAN_STYLES[b.plan] ?? "bg-zinc-700/50 text-zinc-300"}`}
                      >
                        {PLAN_LABELS[b.plan] ?? b.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[b.status] ?? "bg-zinc-700/50 text-zinc-300"}`}
                      >
                        {b.status === "active" ? "Ativo" : "Suspenso"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/barbershops/${b._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-zinc-500">
                {list.length === 0
                  ? "Nenhuma barbearia cadastrada."
                  : "Nenhum resultado para os filtros aplicados."}
              </div>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-800 text-sm text-zinc-500">
            Exibindo {filtered.length} de {list.length} barbearia(s)
          </div>
        )}
      </div>
    </div>
  );
}
