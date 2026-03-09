"use client";

import { useEffect, useState } from "react";
import SelectDark from "@/components/SelectDark";

type ActionPlan = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluído",
  cancelled: "Cancelado",
};
const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export default function PlanosDeAcaoPage() {
  const [list, setList] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState<"new" | ActionPlan | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "pending",
    priority: "medium",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    const q = filterStatus ? `?status=${filterStatus}` : "";
    fetch(`/api/action-plans${q}`)
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  function openNew() {
    setForm({
      title: "",
      description: "",
      dueDate: "",
      status: "pending",
      priority: "medium",
    });
    setModal("new");
    setError("");
  }

  function openEdit(a: ActionPlan) {
    setForm({
      title: a.title,
      description: a.description ?? "",
      dueDate: a.dueDate ? a.dueDate.slice(0, 10) : "",
      status: a.status,
      priority: a.priority,
    });
    setModal(a);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url =
      modal === "new" ? "/api/action-plans" : `/api/action-plans/${(modal as ActionPlan)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        priority: form.priority,
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

  async function remove(a: ActionPlan) {
    if (!confirm("Excluir este plano de ação?")) return;
    const res = await fetch(`/api/action-plans/${a._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Planos de ação</h1>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px]"
        >
          Novo plano
        </button>
      </div>

      <div className="mb-4">
        <SelectDark
          label="Filtrar por status"
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos"
          options={[
            { value: "", label: "Todos" },
            ...Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-gray-400">Nenhum plano de ação.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a._id}
              className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium">{a.title}</p>
                {a.description && (
                  <p className="text-sm text-gray-400 line-clamp-1">{a.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {statusLabels[a.status] ?? a.status} · {priorityLabels[a.priority] ?? a.priority}
                  {a.dueDate &&
                    ` · Vencimento: ${new Date(a.dueDate).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="px-3 py-2 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(a)}
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
            <h2 className="text-xl font-bold mb-4">
              {modal === "new" ? "Novo plano de ação" : "Editar plano de ação"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <input
                required
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
              />
              <textarea
                placeholder="Descrição"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[80px] resize-none"
                rows={3}
              />
              <input
                type="date"
                placeholder="Data de vencimento"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
              />
              <SelectDark
                label="Status"
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))}
              />
              <SelectDark
                label="Prioridade"
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                options={Object.entries(priorityLabels).map(([v, l]) => ({ value: v, label: l }))}
              />
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
