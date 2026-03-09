"use client";

import { useEffect, useState } from "react";

type Cut = {
  _id: string;
  name: string;
  durationMinutes: number;
  price: number;
  category?: string;
};

export default function CortesPage() {
  const [list, setList] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | Cut | null>(null);
  const [form, setForm] = useState({
    name: "",
    durationMinutes: 30,
    price: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/cuts")
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm({ name: "", durationMinutes: 30, price: "", category: "" });
    setModal("new");
    setError("");
  }

  function openEdit(c: Cut) {
    setForm({
      name: c.name,
      durationMinutes: c.durationMinutes,
      price: String(c.price),
      category: c.category ?? "",
    });
    setModal(c);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setError("Preço inválido");
      setSaving(false);
      return;
    }
    const url = modal === "new" ? "/api/cuts" : `/api/cuts/${(modal as Cut)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        durationMinutes: form.durationMinutes,
        price,
        category: form.category || undefined,
      }),
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

  async function remove(c: Cut) {
    if (!confirm("Excluir este corte?")) return;
    const res = await fetch(`/api/cuts/${c._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Cortes</h1>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px]"
        >
          Novo corte
        </button>
      </div>
      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-gray-400">Nenhum corte cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c._id}
              className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-400">
                  {c.durationMinutes} min · R$ {Number(c.price).toFixed(2)}
                  {c.category && ` · ${c.category}`}
                </p>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modal === "new" ? "Novo corte" : "Editar corte"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do corte *</label>
                <input
                  required
                  placeholder="Ex.: Degradê, Social"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ex.: 30"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Tempo estimado do atendimento para agendamento</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Preço (R$) *</label>
                <input
                required
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
              />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                <input
                placeholder="Ex.: Barba, Cabelo"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
              />
              </div>
              <div className="flex gap-2 justify-end">
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
