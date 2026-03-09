"use client";

import { useEffect, useState, useMemo } from "react";
import SelectDark from "@/components/SelectDark";

const CATEGORIAS = [
  "Corte",
  "Barba",
  "Sobrancelha",
  "Coloração",
  "Tratamento",
  "Degradê",
  "Social",
  "Outro",
];

type PortfolioItem = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  featured?: boolean;
  active?: boolean;
  order?: number;
};

export default function PortfolioPage() {
  const [list, setList] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | PortfolioItem | null>(null);
  const [detailModal, setDetailModal] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "",
    featured: false,
    active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    fetch("/api/portfolio-items")
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
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/portfolio/${slug}`
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
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, filterCat, search]);

  const stats = useMemo(() => {
    const active = list.filter((i) => i.active !== false);
    const featured = list.filter((i) => i.featured);
    return { total: list.length, active: active.length, featured: featured.length };
  }, [list]);

  function openNew() {
    setForm({
      title: "",
      description: "",
      imageUrl: "",
      category: "",
      featured: false,
      active: true,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setModal("new");
    setError("");
  }

  function openEdit(item: PortfolioItem) {
    setForm({
      title: item.title,
      description: item.description ?? "",
      imageUrl: item.imageUrl,
      category: item.category ?? "",
      featured: item.featured ?? false,
      active: item.active !== false,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setModal(item);
    setError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem (JPEG, PNG, WebP ou GIF).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 4 MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let imageUrl = form.imageUrl.trim();
    if (selectedFile) {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error || "Falha ao enviar a imagem");
        setSaving(false);
        return;
      }
      imageUrl = uploadData.url;
    }

    if (!imageUrl) {
      setError(modal === "new" ? "Selecione uma imagem para enviar." : "Selecione uma imagem ou mantenha a atual.");
      setSaving(false);
      return;
    }

    const url =
      modal === "new"
        ? "/api/portfolio-items"
        : `/api/portfolio-items/${(modal as PortfolioItem)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        imageUrl,
        category: form.category || undefined,
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setModal(null);
    load();
  }

  async function remove(item: PortfolioItem) {
    if (!confirm(`Remover "${item.title}" do portfólio?`)) return;
    const res = await fetch(`/api/portfolio-items/${item._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function toggleActive(item: PortfolioItem) {
    await fetch(`/api/portfolio-items/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, active: item.active === false }),
    });
    load();
  }

  async function toggleFeatured(item: PortfolioItem) {
    await fetch(`/api/portfolio-items/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, featured: !item.featured }),
    });
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Portfólio</h1>
          <p className="text-sm text-gray-400 mt-1">
            Apresente seu trabalho com fotos e textos. Compartilhe o link com clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-5 py-3 rounded-lg bg-amber-500 text-black font-semibold min-h-[44px] hover:bg-amber-400 transition-colors"
        >
          + Novo trabalho
        </button>
      </div>

      {slug && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-400 mb-1">Link do seu portfólio</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-xs text-gray-400">Visíveis</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-700 bg-white/5 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.featured}</p>
          <p className="text-xs text-gray-400">Destaques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Buscar</label>
          <input
            type="search"
            placeholder="Título ou descrição..."
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

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400 text-lg mb-2">
            {list.length === 0
              ? "Nenhum trabalho no portfólio"
              : "Nenhum resultado encontrado"}
          </p>
          {list.length === 0 && (
            <p className="text-gray-500 text-sm">
              Adicione fotos e textos para apresentar seu trabalho aos clientes.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <li
              key={item._id}
              className={`rounded-xl border overflow-hidden flex flex-col transition-all ${
                item.active === false
                  ? "border-gray-800 bg-white/[0.02] opacity-60"
                  : item.featured
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-gray-700 bg-white/5"
              }`}
            >
              <div
                className="relative h-52 bg-gray-800 cursor-pointer"
                onClick={() => setDetailModal(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {item.featured && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-semibold">
                      Destaque
                    </span>
                  )}
                  {item.active === false && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">
                      Oculto
                    </span>
                  )}
                </div>
                {item.category && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-gray-300 text-xs backdrop-blur-sm">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="cursor-pointer" onClick={() => setDetailModal(item)}>
                  <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(item)}
                    title={item.featured ? "Remover destaque" : "Destacar"}
                    className={`p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                      item.featured ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-500 hover:text-amber-400"
                    }`}
                  >
                    <svg className="w-5 h-5" fill={item.featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    title={item.active === false ? "Exibir" : "Ocultar"}
                    className={`p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                      item.active === false ? "bg-white/5 text-gray-500" : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.active === false ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-4.878-4.878" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="px-3 py-2 rounded-lg border border-gray-600 text-sm min-h-[44px] hover:bg-white/5 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
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

      {detailModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={detailModal.imageUrl}
              alt={detailModal.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-2">
                <h2 className="text-2xl font-bold flex-1">{detailModal.title}</h2>
                {detailModal.featured && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-semibold mt-1">
                    Destaque
                  </span>
                )}
              </div>
              {detailModal.description && (
                <p className="text-gray-300 whitespace-pre-wrap mb-4">{detailModal.description}</p>
              )}
              {detailModal.category && (
                <p className="text-sm text-gray-500">Categoria: {detailModal.category}</p>
              )}
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

      {modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-1">
              {modal === "new" ? "Novo trabalho" : "Editar trabalho"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal === "new"
                ? "Adicione uma amostra do seu trabalho: foto e texto explicando."
                : "Atualize a apresentação deste trabalho."}
            </p>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título *</label>
                <input
                  required
                  placeholder="Ex.: Degradê americano com desenho"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Texto explicando o trabalho *</label>
                <textarea
                  placeholder="Conte o que fez, técnica usada, resultado, por que esse trabalho é especial..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[100px] resize-none placeholder-gray-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Foto *</label>
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-gray-600 bg-white/5 hover:bg-white/[0.07] cursor-pointer transition-colors">
                    <span className="text-sm text-gray-400 mt-2">
                      {selectedFile ? selectedFile.name : (form.imageUrl ? "Imagem atual" : "Clique para enviar uma imagem")}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, WebP ou GIF — máx. 4 MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {(previewUrl || (form.imageUrl && !selectedFile)) && (
                    <div className="relative rounded-xl overflow-hidden bg-gray-800 h-44">
                      <img
                        src={previewUrl || form.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={clearPreview}
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-sm hover:bg-black/90"
                      >
                        Trocar imagem
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <SelectDark
                label="Categoria"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="Selecione"
                options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-5 h-5 rounded accent-amber-500"
                  />
                  <span className="text-sm text-gray-300">Destaque</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="w-5 h-5 rounded accent-green-500"
                  />
                  <span className="text-sm text-gray-300">Visível no portfólio</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { clearPreview(); setModal(null); }}
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
