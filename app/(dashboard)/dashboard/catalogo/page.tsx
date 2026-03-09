"use client";

import { useEffect, useState, useMemo } from "react";
import SelectDark from "@/components/SelectDark";

const CATEGORIAS = [
  "Corte",
  "Barba",
  "Sobrancelha",
  "Coloração",
  "Tratamento",
  "Combo",
  "Outro",
];

type CatalogItem = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  duration?: number;
  featured?: boolean;
  active?: boolean;
  order?: number;
};

export default function CatalogoPage() {
  const [list, setList] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | CatalogItem | null>(null);
  const [detailModal, setDetailModal] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    duration: "",
    featured: false,
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetch("/api/barbershop/info")
      .then((r) => r.json())
      .then((data) => {
        if (data.slug) setSlug(data.slug);
      })
      .catch(() => {});
  }, []);

  const portfolioUrl = slug
    ? `${window.location.origin}/portfolio/${slug}`
    : "";

  function copyLink() {
    if (!portfolioUrl) return;
    navigator.clipboard.writeText(portfolioUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const categories = useMemo(() => {
    const cats = new Set<string>();
    list.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (filterCat) result = result.filter((i) => i.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, filterCat, search]);

  const stats = useMemo(() => {
    const active = list.filter((i) => i.active !== false);
    const featured = list.filter((i) => i.featured);
    const avgPrice =
      active.length > 0
        ? active.reduce((s, i) => s + i.price, 0) / active.length
        : 0;
    return {
      total: list.length,
      active: active.length,
      featured: featured.length,
      avgPrice,
    };
  }, [list]);

  function openNew() {
    setForm({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
      duration: "",
      featured: false,
      active: true,
    });
    setModal("new");
    setError("");
  }

  function openEdit(c: CatalogItem) {
    setForm({
      name: c.name,
      description: c.description ?? "",
      price: String(c.price),
      imageUrl: c.imageUrl ?? "",
      category: c.category ?? "",
      duration: c.duration ? String(c.duration) : "",
      featured: c.featured ?? false,
      active: c.active !== false,
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
    const dur = form.duration ? parseInt(form.duration) : undefined;
    const url =
      modal === "new"
        ? "/api/catalog"
        : `/api/catalog/${(modal as CatalogItem)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        price,
        imageUrl: form.imageUrl || undefined,
        category: form.category || undefined,
        duration: dur,
        featured: form.featured,
        active: form.active,
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

  async function remove(c: CatalogItem) {
    if (!confirm(`Excluir "${c.name}" do catálogo?`)) return;
    const res = await fetch(`/api/catalog/${c._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function toggleActive(c: CatalogItem) {
    await fetch(`/api/catalog/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, active: c.active === false }),
    });
    load();
  }

  async function toggleFeatured(c: CatalogItem) {
    await fetch(`/api/catalog/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, featured: !c.featured }),
    });
    load();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catálogo & Portfólio</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie seus serviços e compartilhe com clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-5 py-3 rounded-lg bg-amber-500 text-black font-semibold min-h-[44px] hover:bg-amber-400 transition-colors"
        >
          + Novo serviço
        </button>
      </div>

      {/* Link do portfólio */}
      {slug && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-400 mb-1">
                Link do seu portfólio
              </p>
              <p className="text-sm text-gray-300 truncate font-mono bg-black/30 rounded-lg px-3 py-2">
                {portfolioUrl}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={copyLink}
                className="px-4 py-2.5 rounded-lg bg-amber-500 text-black font-medium text-sm min-h-[44px] hover:bg-amber-400 transition-colors"
              >
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg border border-amber-500/50 text-amber-400 text-sm min-h-[44px] flex items-center hover:bg-amber-500/10 transition-colors"
              >
                Visualizar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-xs text-gray-400">Ativos</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.featured}</p>
          <p className="text-xs text-gray-400">Destaques</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold">
            R$ {stats.avgPrice.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400">Preço médio</p>
        </div>
      </div>

      {/* Busca e filtro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Buscar</label>
          <input
            type="search"
            placeholder="Nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
          />
        </div>
        <SelectDark
          label="Categoria"
          value={filterCat}
          onChange={setFilterCat}
          placeholder="Todas"
          options={[
            { value: "", label: "Todas" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400 text-lg mb-2">
            {list.length === 0
              ? "Nenhum serviço cadastrado ainda"
              : "Nenhum resultado encontrado"}
          </p>
          {list.length === 0 && (
            <p className="text-gray-500 text-sm">
              Adicione seus cortes e serviços para montar seu portfólio.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <li
              key={c._id}
              className={`rounded-xl border overflow-hidden flex flex-col transition-all ${
                c.active === false
                  ? "border-gray-800 bg-white/[0.02] opacity-60"
                  : c.featured
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-gray-700 bg-white/5"
              }`}
            >
              {/* Imagem */}
              <div
                className="relative h-44 bg-gray-800 cursor-pointer"
                onClick={() => setDetailModal(c)}
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {c.featured && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-semibold">
                      Destaque
                    </span>
                  )}
                  {c.active === false && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">
                      Inativo
                    </span>
                  )}
                </div>
                {c.category && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-gray-300 text-xs backdrop-blur-sm">
                    {c.category}
                  </span>
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-4 flex-1 flex flex-col">
                <div
                  className="cursor-pointer"
                  onClick={() => setDetailModal(c)}
                >
                  <h3 className="font-semibold text-lg leading-tight">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xl font-bold text-amber-400">
                      R$ {Number(c.price).toFixed(2)}
                    </span>
                    {c.duration && (
                      <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-2 py-0.5">
                        {c.duration} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(c)}
                    title={c.featured ? "Remover destaque" : "Destacar"}
                    className={`p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                      c.featured
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-white/5 text-gray-500 hover:text-amber-400"
                    }`}
                  >
                    <svg className="w-5 h-5" fill={c.featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    title={c.active === false ? "Ativar" : "Desativar"}
                    className={`p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                      c.active === false
                        ? "bg-white/5 text-gray-500"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.active === false ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-4.878-4.878" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="px-3 py-2 rounded-lg border border-gray-600 text-sm min-h-[44px] hover:bg-white/5 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm min-h-[44px] hover:bg-red-500/10 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de detalhes (somente leitura) */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {detailModal.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detailModal.imageUrl}
                alt={detailModal.name}
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <h2 className="text-2xl font-bold flex-1">{detailModal.name}</h2>
                {detailModal.featured && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-semibold mt-1">
                    Destaque
                  </span>
                )}
              </div>
              {detailModal.description && (
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{detailModal.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Preço</p>
                  <p className="text-xl font-bold text-amber-400">
                    R$ {Number(detailModal.price).toFixed(2)}
                  </p>
                </div>
                {detailModal.duration && (
                  <div>
                    <p className="text-xs text-gray-500">Duração</p>
                    <p className="text-lg font-medium">{detailModal.duration} min</p>
                  </div>
                )}
                {detailModal.category && (
                  <div>
                    <p className="text-xs text-gray-500">Categoria</p>
                    <p className="text-lg font-medium">{detailModal.category}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    detailModal.active !== false
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {detailModal.active !== false ? "Ativo" : "Inativo"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="mt-6 w-full py-3 rounded-lg border border-gray-600 text-gray-300 min-h-[44px] hover:bg-white/5 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-1">
              {modal === "new" ? "Novo serviço" : "Editar serviço"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal === "new"
                ? "Adicione um serviço ao seu portfólio."
                : "Atualize os dados do serviço."}
            </p>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do serviço *</label>
                <input
                  required
                  placeholder="Ex.: Degradê americano"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea
                  placeholder="Descreva o serviço para seus clientes..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[80px] resize-none placeholder-gray-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço (R$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="35.00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="30"
                    value={form.duration}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
              </div>
              <SelectDark
                label="Categoria"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="Selecione"
                options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL da imagem</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featured: e.target.checked }))
                    }
                    className="w-5 h-5 rounded accent-amber-500"
                  />
                  <span className="text-sm text-gray-300">Destaque</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                    className="w-5 h-5 rounded accent-green-500"
                  />
                  <span className="text-sm text-gray-300">Ativo no portfólio</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px] hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] disabled:opacity-50 hover:bg-amber-400 transition-colors"
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
