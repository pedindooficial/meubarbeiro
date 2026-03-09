"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

type PortfolioItem = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  featured?: boolean;
};

type PortfolioData = {
  barbershop: { name: string; slug: string; logo?: string | null; phone?: string | null; address?: string | null };
  items: PortfolioItem[];
};

export default function PortfolioPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [detail, setDetail] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/portfolio/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: PortfolioData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = new Set<string>();
    data.items.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!selectedCat) return data.items;
    return data.items.filter((i) => i.category === selectedCat);
  }, [data, selectedCat]);

  const featuredItems = useMemo(
    () => filtered.filter((i) => i.featured),
    [filtered]
  );
  const regularItems = useMemo(
    () => filtered.filter((i) => !i.featured),
    [filtered]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Carregando portfólio…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Portfólio não encontrado</h1>
          <p className="text-gray-400">
            Essa barbearia não existe ou não está disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-5 shadow-lg overflow-hidden">
            {data.barbershop.logo ? (
              <img src={data.barbershop.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{data.barbershop.name}</h1>
          <p className="text-gray-400 text-lg">Amostra do meu trabalho</p>
          {data.items.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {data.items.length} trabalho{data.items.length > 1 ? "s" : ""} no portfólio
            </p>
          )}
        </div>
      </header>

      {categories.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setSelectedCat("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                selectedCat === ""
                  ? "bg-amber-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-gray-700"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                  selectedCat === cat
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {featuredItems.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-amber-400 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Destaques
            </h2>
            <div className="space-y-10">
              {featuredItems.map((item) => (
                <article
                  key={item._id}
                  className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden"
                >
                  <div
                    className="relative h-72 sm:h-80 bg-gray-800 cursor-pointer"
                    onClick={() => setDetail(item)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500 text-black text-xs font-bold mb-2">
                        Destaque
                      </span>
                      <h3 className="text-2xl font-bold">{item.title}</h3>
                    </div>
                  </div>
                  {item.description && (
                    <div className="p-6 pt-4">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                  )}
                  {item.category && (
                    <p className="px-6 pb-4 text-sm text-gray-500">Categoria: {item.category}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {regularItems.length > 0 && (
          <section>
            {featuredItems.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-300 mb-6">Mais trabalhos</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {regularItems.map((item) => (
                <article
                  key={item._id}
                  onClick={() => setDetail(item)}
                  className="group cursor-pointer rounded-xl border border-gray-700 bg-white/[0.02] overflow-hidden hover:border-gray-600 hover:bg-white/[0.04] transition-all"
                >
                  <div className="relative h-56 bg-gray-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.category && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-gray-300 text-xs backdrop-blur-sm">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-3">{item.description}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg">Nenhum trabalho publicado no momento</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-600">Portfólio de {data.barbershop.name}</p>
          {(data.barbershop.phone || data.barbershop.address) && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {data.barbershop.phone && <p>{data.barbershop.phone}</p>}
              {data.barbershop.address && <p>{data.barbershop.address}</p>}
            </div>
          )}
        </div>
      </footer>

      {detail && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-shrink-0">
              <img
                src={detail.imageUrl}
                alt={detail.title}
                className="w-full h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <h2 className="text-2xl font-bold">{detail.title}</h2>
                {detail.featured && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
                    Destaque
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {detail.description && (
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {detail.description}
                </p>
              )}
              {detail.category && (
                <p className="mt-4 text-sm text-gray-500">Categoria: {detail.category}</p>
              )}
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-gray-600 text-gray-300 min-h-[44px] hover:bg-white/10 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
