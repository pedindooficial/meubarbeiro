"use client";

import { useEffect, useState, useMemo } from "react";
import SelectDark from "@/components/SelectDark";

const TIPOS_CABELO = ["Liso", "Ondulado", "Cacheado", "Crespo", "Outro"];

const FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "phone", label: "Com telefone" },
  { value: "email", label: "Com email" },
  ...TIPOS_CABELO.map((t) => ({ value: `tipo:${t}`, label: `Tipo: ${t}` })),
];

type Client = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  preferenciaCorte?: string;
  tipoCabelo?: string;
};

type TopClient = Client & { completedCount?: number; totalRevenue?: number };

type PlanInfo = { plan: string; planName: string; maxClients: number };

export default function ClientesPage() {
  const [list, setList] = useState<Client[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState<"new" | Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    preferenciaCorte: "",
    tipoCabelo: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/clients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const [debouncedValue, setDebouncedValue] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedValue.trim()) params.set("search", debouncedValue.trim());
    fetch(`/api/clients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedValue]);

  useEffect(() => {
    fetch("/api/clients/top?limit=3")
      .then((r) => r.json())
      .then((data) => setTopClients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [list]);

  useEffect(() => {
    fetch("/api/checkout/current")
      .then((r) => r.json())
      .then((data: PlanInfo) => setPlanInfo(data))
      .catch(() => {});
  }, []);

  const filteredList = useMemo(() => {
    if (!filter) return list;
    if (filter === "phone") return list.filter((c) => c.phone?.trim());
    if (filter === "email") return list.filter((c) => c.email?.trim());
    if (filter.startsWith("tipo:")) {
      const tipo = filter.replace("tipo:", "");
      return list.filter((c) => c.tipoCabelo === tipo);
    }
    return list;
  }, [list, filter]);

  function openNew() {
    setForm({
      name: "",
      phone: "",
      email: "",
      notes: "",
      preferenciaCorte: "",
      tipoCabelo: "",
    });
    setModal("new");
    setError("");
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      notes: c.notes ?? "",
      preferenciaCorte: c.preferenciaCorte ?? "",
      tipoCabelo: c.tipoCabelo ?? "",
    });
    setModal(c);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = modal === "new" ? "/api/clients" : `/api/clients/${(modal as Client)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }
    setModal(null);
    load();
  }

  async function remove(c: Client) {
    if (!confirm("Excluir este cliente?")) return;
    const res = await fetch(`/api/clients/${c._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          {planInfo && (
            <p className="text-sm text-gray-400 mt-1">
              {list.length}
              {planInfo.maxClients >= 0 ? `/${planInfo.maxClients}` : ""} clientes
              {" · "}
              <span className="text-amber-400">Plano {planInfo.planName}</span>
              {planInfo.maxClients >= 0 && list.length >= planInfo.maxClients && (
                <span className="text-red-400 ml-2">
                  — Limite atingido.{" "}
                  <a href="/dashboard/planos" className="underline hover:text-red-300">
                    Fazer upgrade
                  </a>
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px]"
        >
          Novo cliente
        </button>
      </div>

      {/* Barra de busca e filtro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Buscar</label>
          <input
            type="search"
            placeholder="Nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
          />
        </div>
        <SelectDark
          label="Filtrar"
          value={filter}
          onChange={setFilter}
          placeholder="Todos"
          options={FILTER_OPTIONS}
        />
      </div>

      {/* Top 3 melhores clientes */}
      {topClients.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-6">
          <h2 className="text-lg font-semibold text-amber-400/90 mb-3">Top 3 melhores clientes</h2>
          <ul className="space-y-2">
            {topClients.map((c, i) => (
              <li
                key={c._id}
                className="flex items-center justify-between gap-2 py-2 border-b border-amber-500/20 last:border-0"
              >
                <span className="text-amber-300/90 font-medium">
                  {i + 1}º {c.name}
                </span>
                <span className="text-sm text-gray-400">
                  {c.completedCount ?? 0} atendimentos
                  {c.totalRevenue != null && c.totalRevenue > 0 && ` · ${Number(c.totalRevenue).toFixed(2)} em receita`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : filteredList.length === 0 ? (
        <p className="text-gray-400">
          {list.length === 0
            ? "Nenhum cliente. Clique em \"Novo cliente\" para adicionar."
            : "Nenhum cliente encontrado com os filtros aplicados."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredList.map((c) => (
            <li
              key={c._id}
              className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                {c.phone && <p className="text-sm text-gray-400">{c.phone}</p>}
                {c.email && <p className="text-sm text-gray-400">{c.email}</p>}
                {(c.tipoCabelo || c.preferenciaCorte) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {[c.tipoCabelo, c.preferenciaCorte].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="px-3 py-2 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  className="px-3 py-2 rounded-lg border border-red-500/50 text-red-400 min-h-[44px]"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-1">
              {modal === "new" ? "Novo cliente" : "Editar cliente"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Preencha os dados do cliente.</p>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                <input
                  required
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
              </div>
              <SelectDark
                label="Tipo de cabelo"
                value={form.tipoCabelo}
                onChange={(v) => setForm((f) => ({ ...f, tipoCabelo: v }))}
                placeholder="Selecione"
                options={TIPOS_CABELO.map((t) => ({ value: t, label: t }))}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Preferência de corte</label>
                <input
                  placeholder="Ex.: degradê, social, máquina 2, etc."
                  value={form.preferenciaCorte}
                  onChange={(e) => setForm((f) => ({ ...f, preferenciaCorte: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea
                  placeholder="Anotações gerais sobre o cliente"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[80px] resize-none placeholder-gray-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px] disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
