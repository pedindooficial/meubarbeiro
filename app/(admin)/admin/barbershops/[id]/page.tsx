"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SelectDark from "@/components/SelectDark";

type Barbershop = {
  _id: string;
  name: string;
  slug: string;
  ownerId: { name?: string; email?: string } | string;
  plan: string;
  status: string;
};

export default function AdminBarbershopEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", plan: "free", status: "active" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/barbershops/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Não encontrado");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setForm({
          name: d.name,
          plan: d.plan,
          status: d.status,
        });
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
    router.push("/admin");
  }

  if (loading) return <p className="text-gray-400">Carregando…</p>;
  if (!data) return <p className="text-gray-400">Barbearia não encontrada.</p>;

  const owner = typeof data.ownerId === "object" ? data.ownerId : null;

  return (
    <div>
      <Link href="/admin" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-4">Editar barbearia</h1>
      <p className="text-gray-400 mb-4">
        {data.name} · {data.slug}
        {owner && (
          <span className="block text-sm mt-1">
            Dono: {owner.email} {owner.name && `(${owner.name})`}
          </span>
        )}
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
            required
          />
        </div>
        <SelectDark
          label="Plano"
          value={form.plan}
          onChange={(v) => setForm((f) => ({ ...f, plan: v }))}
          options={[
            { value: "free", label: "Free" },
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-3 rounded-lg bg-white text-black font-medium min-h-[44px] disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          <Link
            href="/admin"
            className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px] flex items-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
