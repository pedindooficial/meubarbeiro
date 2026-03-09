"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconCalendar,
  IconFinance,
  IconScissors,
  IconCatalog,
  IconClipboard,
} from "@/components/DashboardIcons";

type NextAppointment = {
  _id: string;
  scheduledAt: string;
  client: { name?: string; phone?: string } | null;
  cut: string | null;
};

type Stats = {
  clientsCount: number;
  appointmentsToday: number;
  appointmentsUpcoming: number;
  receita: number;
  despesa: number;
  saldo: number;
  nextAppointment: NextAppointment | null;
};

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          ...data,
          receita: typeof data.receita === "number" && !isNaN(data.receita) ? data.receita : 0,
          despesa: typeof data.despesa === "number" && !isNaN(data.despesa) ? data.despesa : 0,
          saldo: typeof data.saldo === "number" && !isNaN(data.saldo) ? data.saldo : 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Visão geral da sua barbearia. Acompanhe clientes, agendamentos e financeiro.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/dashboard/agendamentos"
              className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-amber-500/30 flex items-center justify-center">
                <IconCalendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.appointmentsToday}</p>
                <p className="text-sm text-amber-400/90">Agendamentos hoje</p>
              </div>
            </Link>
            <Link
              href="/dashboard/agendamentos?proximos=1"
              className="p-5 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <IconCalendar className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.appointmentsUpcoming}</p>
                <p className="text-sm text-gray-400">Próximos 7 dias</p>
              </div>
            </Link>
            <Link
              href="/dashboard/clientes"
              className="p-5 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <IconUsers className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.clientsCount}</p>
                <p className="text-sm text-gray-400">Clientes</p>
              </div>
            </Link>
            <Link
              href="/dashboard/financeiro"
              className="p-5 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <IconFinance className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.saldo >= 0 ? (
                    <span className="text-green-400">{formatBRL(stats.saldo)}</span>
                  ) : (
                    <span className="text-red-400">{formatBRL(stats.saldo)}</span>
                  )}
                </p>
                <p className="text-sm text-gray-400">Saldo</p>
              </div>
            </Link>
          </div>

          {stats.nextAppointment ? (
            <Link
              href="/dashboard/agendamentos"
              className="block p-5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 transition-colors mb-6"
            >
              <p className="text-sm font-medium text-amber-400/90 mb-1">Próximo agendamento</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {new Date(stats.nextAppointment.scheduledAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-gray-300 mt-1">
                {stats.nextAppointment.client?.name ?? "Cliente"}
                {stats.nextAppointment.cut ? ` · ${stats.nextAppointment.cut}` : ""}
              </p>
            </Link>
          ) : (
            <div className="p-5 rounded-xl border border-gray-700 bg-white/5 mb-6">
              <p className="text-sm text-gray-400">Próximo agendamento</p>
              <p className="text-gray-500 mt-1">Nenhum agendamento próximo</p>
            </div>
          )}

          <div className="p-4 rounded-xl border border-gray-700 bg-white/5 mb-6">
            <p className="text-sm text-gray-400 mb-2">Resumo financeiro (total)</p>
            <div className="flex flex-wrap gap-6">
              <span className="text-green-400 font-medium">Receita: {formatBRL(stats.receita)}</span>
              <span className="text-red-400 font-medium">Despesa: {formatBRL(stats.despesa)}</span>
            </div>
          </div>
        </>
      ) : null}

      <h2 className="text-lg font-semibold text-gray-300 mb-3">Acesso rápido</h2>
      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/agendamentos"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconCalendar className="w-5 h-5 text-amber-400 shrink-0" />
          Agendamentos
        </Link>
        <Link
          href="/dashboard/clientes"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconUsers className="w-5 h-5 text-gray-400 shrink-0" />
          Clientes
        </Link>
        <Link
          href="/dashboard/cortes"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconScissors className="w-5 h-5 text-gray-400 shrink-0" />
          Cortes
        </Link>
        <Link
          href="/dashboard/catalogo"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconCatalog className="w-5 h-5 text-gray-400 shrink-0" />
          Catálogo
        </Link>
        <Link
          href="/dashboard/financeiro"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconFinance className="w-5 h-5 text-gray-400 shrink-0" />
          Financeiro
        </Link>
        <Link
          href="/dashboard/planos-de-acao"
          className="p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 min-h-[48px] flex items-center gap-3 transition-colors"
        >
          <IconClipboard className="w-5 h-5 text-gray-400 shrink-0" />
          Planos de ação
        </Link>
      </nav>
    </div>
  );
}
