import Link from "next/link";

const features = [
  { title: "Clientes", desc: "Cadastro e histórico em um só lugar." },
  { title: "Cortes e preços", desc: "Serviços, duração e valores organizados." },
  { title: "Financeiro", desc: "Receitas, despesas e visão do negócio." },
  { title: "Planos de ação", desc: "Metas e tarefas para crescer." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* Fundo com leve gradiente e textura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      <div className="relative min-h-screen flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
          <span className="text-amber-400/90 text-sm font-medium tracking-widest uppercase mb-4">
            Gestão para barbearias
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center max-w-2xl mb-5 tracking-tight">
            Tudo da sua barbearia{" "}
            <span className="text-amber-400">em um lugar</span>
          </h1>
          <p className="text-gray-400 text-center text-lg max-w-xl mb-10">
            Clientes, cortes, catálogo, análise financeira e planos de ação. Use no celular, tablet ou computador — inclusive dentro do app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/registro"
              className="px-8 py-4 rounded-xl bg-amber-500 text-black font-semibold min-h-[48px] flex items-center justify-center hover:bg-amber-400 transition-colors touch-manipulation shadow-lg shadow-amber-500/20"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-gray-600 text-gray-300 font-medium min-h-[48px] flex items-center justify-center hover:border-amber-500/50 hover:text-amber-400/90 transition-colors touch-manipulation"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        {/* Features em grid */}
        <section className="relative px-6 py-16 md:py-24 border-t border-gray-800/80">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center text-gray-300 mb-10">
              O que você gerencia
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-5 rounded-xl bg-white/[0.03] border border-gray-800/80 hover:border-amber-500/20 transition-colors"
                >
                  <h3 className="font-semibold text-amber-400/90 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative px-6 py-12 border-t border-gray-800/80">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-gray-500 text-sm mb-4">
              Pronto para organizar sua barbearia?
            </p>
            <Link
              href="/registro"
              className="inline-block px-6 py-3 rounded-lg bg-amber-500/20 text-amber-400 font-medium border border-amber-500/30 hover:bg-amber-500/30 transition-colors min-h-[44px] flex items-center justify-center mx-auto touch-manipulation"
            >
              Criar conta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
