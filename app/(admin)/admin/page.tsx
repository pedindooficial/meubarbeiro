"use client";

import { useEffect, useState } from "react";
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

type Stats = { totalBarbershops: number; byPlan: Record<string, number> };

export default function AdminPage() {
  const [list, setList] = useState<Barbershop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Painel Admin</h1>
      <p className="text-gray-400 mb-6">
        Gerencie todas as barbearias cadastradas no sistema.
      </p>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-700 bg-white/5">
            <p className="text-sm text-gray-400">Total de barbearias</p>
            <p className="text-2xl font-bold">{stats.totalBarbershops}</p>
          </div>
          {Object.entries(stats.byPlan || {}).map(([plan, count]) => (
            <div key={plan} className="p-4 rounded-lg border border-gray-700 bg-white/5">
              <p className="text-sm text-gray-400">Plano {plan}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-2">Barbearia</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Dono</th>
                <th className="text-left py-3 px-2">Plano</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id} className="border-b border-gray-800">
                  <td className="py-3 px-2">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-gray-500">{b.slug}</p>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    {typeof b.ownerId === "object" && b.ownerId
                      ? (b.ownerId as { name?: string; email?: string }).email
                      : "-"}
                  </td>
                  <td className="py-3 px-2">{b.plan}</td>
                  <td className="py-3 px-2">{b.status}</td>
                  <td className="py-3 px-2">
                    <Link
                      href={`/admin/barbershops/${b._id}`}
                      className="text-sm text-white underline hover:no-underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="text-gray-400 py-6 text-center">Nenhuma barbearia cadastrada.</p>
          )}
        </div>
      )}
    </div>
  );
}
