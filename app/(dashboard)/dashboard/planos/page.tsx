"use client";

import { useEffect, useState } from "react";

type BarbershopInfo = {
  plan?: string;
};

const PLANS = [
  {
    key: "free",
    name: "Grátis",
    price: "R$ 0",
    period: "",
    desc: "Para começar",
    features: [
      "Até 20 clientes",
      "Agendamentos",
      "Cortes e catálogo",
      "Financeiro básico",
    ],
    highlight: false,
  },
  {
    key: "basic",
    name: "Básico",
    price: "R$ 9,90",
    period: "/mês",
    desc: "Para barbearias em crescimento",
    features: [
      "Até 150 clientes",
      "Tudo do plano Grátis",
      "Planos de ação",
      "Relatórios financeiros",
    ],
    highlight: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "R$ 29,90",
    period: "/mês",
    desc: "Sem limites",
    features: [
      "Clientes ilimitados",
      "Tudo do plano Básico",
      "Prioridade no suporte",
      "Recursos exclusivos",
    ],
    highlight: false,
  },
];

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    fetch("/api/checkout/current")
      .then((r) => r.json())
      .then((data: BarbershopInfo) => {
        if (data.plan) setCurrentPlan(data.plan);
      })
      .catch(() => {});
  }, []);

  async function handleSelect(planKey: string) {
    if (planKey === "free" || planKey === currentPlan) return;
    setError("");
    setLoading(planKey);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao iniciar checkout");
        setLoading(null);
        return;
      }
      if (data.url) window.location.href = data.url;
      else setLoading(null);
    } catch {
      setError("Erro de conexão.");
      setLoading(null);
    }
  }

  function buttonLabel(planKey: string) {
    if (planKey === currentPlan) return "Plano atual";
    if (planKey === "free") return "Plano atual";
    if (loading === planKey) return "Redirecionando…";
    return "Assinar";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Planos</h1>
      <p className="text-gray-400 mb-6">
        Escolha o melhor plano para sua barbearia. Upgrade a qualquer momento.
      </p>
      {error && (
        <p className="text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <div
              key={plan.key}
              className={`p-6 rounded-xl border flex flex-col ${
                plan.highlight
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-gray-700 bg-white/5"
              } ${isCurrent ? "ring-2 ring-amber-500/60" : ""}`}
            >
              {plan.highlight && (
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
                  Mais popular
                </span>
              )}
              {isCurrent && (
                <span className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">
                  Seu plano
                </span>
              )}
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-gray-400 text-sm mb-3">{plan.desc}</p>
              <p className="text-3xl font-bold mb-1">
                {plan.price}
                {plan.period && (
                  <span className="text-base font-normal text-gray-400">
                    {plan.period}
                  </span>
                )}
              </p>
              <ul className="mt-4 mb-6 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSelect(plan.key)}
                disabled={isCurrent || plan.key === "free" || !!loading}
                className={`w-full px-4 py-3 rounded-lg font-medium min-h-[44px] disabled:opacity-50 transition-colors ${
                  plan.highlight && !isCurrent
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : isCurrent
                      ? "bg-white/10 text-gray-400 cursor-default"
                      : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {buttonLabel(plan.key)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
