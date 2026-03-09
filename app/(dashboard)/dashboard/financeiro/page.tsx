"use client";

import { useEffect, useState } from "react";
import SelectDark from "@/components/SelectDark";

type FinancialRecord = {
  _id: string;
  type: "receita" | "despesa";
  amount: number;
  description?: string;
  date: string;
  category?: string;
  recurrence?: string;
  isFixedExpense?: boolean;
};

type Summary = { receita: number; despesa: number; saldo: number };

const RECURRENCE_OPTIONS = [
  { value: "unique", label: "Único (uma vez)" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const CATEGORY_DESPESA = [
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Telefone",
  "Salários",
  "Impostos",
  "Produtos / Materiais",
  "Manutenção",
  "Outros",
];

const CATEGORY_RECEITA = ["Atendimento", "Produtos", "Outros"];

export default function FinanceiroPage() {
  const [list, setList] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | FinancialRecord | null>(null);
  const [form, setForm] = useState({
    type: "receita" as "receita" | "despesa",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    category: "",
    recurrence: "unique",
    isFixedExpense: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function query() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const q = params.toString();
    return q ? `?${q}` : "";
  }

  function load() {
    setLoading(true);
    const q = query();
    Promise.all([
      fetch(`/api/financial${q}`).then((r) => r.json()),
      fetch(`/api/financial/summary${q}`).then((r) => r.json()),
    ])
      .then(([data, sum]) => {
        setList(Array.isArray(data) ? data : []);
        setSummary(sum);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  function openNew() {
    setForm({
      type: "receita",
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      category: "",
      recurrence: "unique",
      isFixedExpense: false,
    });
    setModal("new");
    setError("");
  }

  function openEdit(r: FinancialRecord) {
    setForm({
      type: r.type,
      amount: String(r.amount),
      description: r.description ?? "",
      date: r.date.slice(0, 10),
      category: r.category ?? "",
      recurrence: r.recurrence ?? "unique",
      isFixedExpense: !!r.isFixedExpense,
    });
    setModal(r);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Valor inválido");
      setSaving(false);
      return;
    }
    const url =
      modal === "new" ? "/api/financial" : `/api/financial/${(modal as FinancialRecord)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        amount,
        description: form.description || undefined,
        date: form.date,
        category: form.category || undefined,
        recurrence: form.recurrence,
        isFixedExpense: form.type === "despesa" ? form.isFixedExpense : false,
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

  async function remove(r: FinancialRecord) {
    if (!confirm("Excluir este lançamento?")) return;
    const res = await fetch(`/api/financial/${r._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const recurrenceLabel: Record<string, string> = {
    unique: "Único",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  };

  const categoryOptions = form.type === "despesa" ? CATEGORY_DESPESA : CATEGORY_RECEITA;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Análise financeira</h1>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px]"
        >
          Novo lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="block">
          <span className="text-sm text-gray-400">De</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Até</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] mt-1"
          />
        </label>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
            <p className="text-sm text-gray-400">Receita</p>
            <p className="text-xl font-bold text-green-400">{formatBRL(summary.receita)}</p>
          </div>
          <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-gray-400">Despesa</p>
            <p className="text-xl font-bold text-red-400">{formatBRL(summary.despesa)}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-600 bg-white/5">
            <p className="text-sm text-gray-400">Saldo</p>
            <p className="text-xl font-bold">
              {summary.saldo >= 0 ? (
                <span className="text-green-400">{formatBRL(summary.saldo)}</span>
              ) : (
                <span className="text-red-400">{formatBRL(summary.saldo)}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-gray-400">Nenhum lançamento no período.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li
              key={r._id}
              className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className={r.type === "receita" ? "text-green-400" : "text-red-400"}>
                  {r.type === "receita" ? "+" : "-"} {formatBRL(r.amount)}
                  {(r.recurrence && r.recurrence !== "unique") && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      · {recurrenceLabel[r.recurrence] ?? r.recurrence}
                    </span>
                  )}
                  {r.isFixedExpense && (
                    <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                      Gasto fixo
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(r.date).toLocaleDateString("pt-BR")}
                  {r.description && ` · ${r.description}`}
                  {r.category && ` · ${r.category}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="px-3 py-2 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(r)}
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
              {modal === "new" ? "Novo lançamento" : "Editar lançamento"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <span className="text-sm text-gray-400">Tipo</span>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input
                      type="radio"
                      name="type"
                      value="receita"
                      checked={form.type === "receita"}
                      onChange={() => setForm((f) => ({ ...f, type: "receita" }))}
                    />
                    Receita
                  </label>
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input
                      type="radio"
                      name="type"
                      value="despesa"
                      checked={form.type === "despesa"}
                      onChange={() => setForm((f) => ({ ...f, type: "despesa" }))}
                    />
                    Despesa
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor (R$) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={0.01}
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
                />
              </div>
              <SelectDark
                label="Recorrência"
                value={form.recurrence}
                onChange={(v) => setForm((f) => ({ ...f, recurrence: v }))}
                options={RECURRENCE_OPTIONS}
              />
              {form.type === "despesa" && (
                <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFixedExpense}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => ({
                        ...f,
                        isFixedExpense: checked,
                        recurrence: checked && f.recurrence === "unique" ? "monthly" : f.recurrence,
                      }));
                    }}
                    className="rounded border-gray-600 bg-white/5"
                  />
                  <span className="text-sm text-gray-400">Gasto fixo (ex.: aluguel, contas)</span>
                </label>
              )}
              <SelectDark
                label="Categoria"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="Selecione ou deixe em branco"
                options={[
                  { value: "", label: "—" },
                  ...categoryOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <input
                  placeholder="Ex.: Pagamento aluguel março"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
