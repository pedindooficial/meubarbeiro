"use client";

import { useEffect, useState } from "react";

type AddressParts = {
  addressLogradouro?: string;
  addressNumero?: string;
  addressComplemento?: string;
  addressBairro?: string;
  addressCidade?: string;
  addressEstado?: string;
  addressCep?: string;
};

type BarbershopInfo = {
  name: string;
  slug: string;
  plan: string;
  logo?: string;
  phone?: string;
  profileComplete?: boolean;
} & AddressParts;

export default function ConfiguracoesPage() {
  const [info, setInfo] = useState<BarbershopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo: "",
    phone: "",
    addressLogradouro: "",
    addressNumero: "",
    addressComplemento: "",
    addressBairro: "",
    addressCidade: "",
    addressEstado: "",
    addressCep: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsSetup(params.get("setup") === "1");
    }
  }, []);

  type ViaCepResponse = {
    cep?: string;
    logradouro?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
  };

  async function fetchCep() {
    const onlyDigits = form.addressCep.replace(/\D/g, "");
    if (onlyDigits.length !== 8) return;
    setCepError("");
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
      const data: ViaCepResponse = await res.json();
      if (data.erro || !data.cep) {
        setCepError("CEP não encontrado.");
        setCepLoading(false);
        return;
      }
      setForm((f) => ({
        ...f,
        addressCep: data.cep?.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") ?? f.addressCep,
        addressLogradouro: data.logradouro ?? f.addressLogradouro,
        addressBairro: data.bairro ?? f.addressBairro,
        addressCidade: data.localidade ?? f.addressCidade,
        addressEstado: data.uf ?? f.addressEstado,
      }));
    } catch {
      setCepError("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepBlur() {
    const onlyDigits = form.addressCep.replace(/\D/g, "");
    if (onlyDigits.length === 8) fetchCep();
  }

  function handleCepChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((f) => ({ ...f, addressCep: formatted }));
    setCepError("");
  }

  useEffect(() => {
    fetch("/api/barbershop/info")
      .then((r) => r.json())
      .then((data: BarbershopInfo) => {
        setInfo(data);
        setForm({
          name: data.name || "",
          logo: data.logo || "",
          phone: data.phone || "",
          addressLogradouro: data.addressLogradouro || "",
          addressNumero: data.addressNumero || "",
          addressComplemento: data.addressComplemento || "",
          addressBairro: data.addressBairro || "",
          addressCidade: data.addressCidade || "",
          addressEstado: data.addressEstado || "",
          addressCep: data.addressCep || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem (JPEG, PNG, WebP ou GIF).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("O logo deve ter no máximo 2 MB.");
      return;
    }
    setError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function clearLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    let logoUrl = form.logo?.trim() || "";
    if (logoFile) {
      const fd = new FormData();
      fd.set("file", logoFile);
      fd.set("type", "logo");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) {
        if (up.status === 503) {
          setError("Upload não configurado. Use a URL do logo abaixo ou configure BLOB_READ_WRITE_TOKEN no Vercel (Storage).");
        } else {
          setError(upData.error || "Falha ao enviar o logo");
        }
        setSaving(false);
        return;
      }
      logoUrl = upData.url;
    }

    if (!logoUrl) {
      setError("Adicione o logo: envie um arquivo ou cole a URL da imagem.");
      setSaving(false);
      return;
    }

    if (!form.name.trim()) {
      setError("Nome da barbearia é obrigatório.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/barbershop/info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        logo: logoUrl || undefined,
        phone: form.phone.trim() || undefined,
        addressLogradouro: form.addressLogradouro.trim() || undefined,
        addressNumero: form.addressNumero.trim() || undefined,
        addressComplemento: form.addressComplemento.trim() || undefined,
        addressBairro: form.addressBairro.trim() || undefined,
        addressCidade: form.addressCidade.trim() || undefined,
        addressEstado: form.addressEstado.trim() || undefined,
        addressCep: form.addressCep.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }
    setForm((f) => ({
      ...f,
      logo: logoUrl || f.logo,
      name: data.name ?? f.name,
      phone: data.phone ?? f.phone,
      addressLogradouro: (data as AddressParts).addressLogradouro ?? f.addressLogradouro,
      addressNumero: (data as AddressParts).addressNumero ?? f.addressNumero,
      addressComplemento: (data as AddressParts).addressComplemento ?? f.addressComplemento,
      addressBairro: (data as AddressParts).addressBairro ?? f.addressBairro,
      addressCidade: (data as AddressParts).addressCidade ?? f.addressCidade,
      addressEstado: (data as AddressParts).addressEstado ?? f.addressEstado,
      addressCep: (data as AddressParts).addressCep ?? f.addressCep,
    }));
    setInfo((i) => (i ? { ...i, ...data, profileComplete: true } : null));
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setSuccess(true);
  }

  if (loading) {
    return (
      <div>
        <p className="text-gray-400">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="lg:min-h-0">
      <h1 className="text-2xl font-bold mb-1 lg:mb-2">Configurações</h1>
      <p className="text-gray-400 mb-4 lg:mb-5 text-sm lg:text-base">
        Dados da barbearia e preferências. O nome e o logo aparecem no portfólio público.
      </p>

      {isSetup && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 mb-4 lg:mb-5">
          <p className="text-amber-200 text-sm font-medium">
            Complete os dados da sua barbearia para que seu portfólio exiba o nome e o logo corretos (e não seu nome pessoal).
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 bg-red-400/10 rounded-lg p-3 mb-3 text-sm">{error}</p>
      )}
      {success && (
        <p className="text-green-400 bg-green-400/10 rounded-lg p-3 mb-3 text-sm">
          Configurações salvas com sucesso.
        </p>
      )}

      <form onSubmit={save} className="w-full max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">
          {/* Coluna esquerda: nome, logo, telefone e botão */}
          <div className="space-y-4 lg:space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 lg:mb-2">Nome da barbearia *</label>
              <input
                type="text"
                required
                placeholder="Ex.: Barbearia do Zé"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Esse nome aparece no portfólio e para os clientes.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 lg:mb-2">Logo da barbearia *</label>
              <div className="space-y-2 lg:space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-24 md:h-28 rounded-xl border-2 border-dashed border-gray-600 bg-white/5 hover:bg-white/[0.07] cursor-pointer transition-colors">
                  <span className="text-sm text-gray-400">
                    {logoFile ? logoFile.name : (form.logo ? "Logo atual" : "Clique para enviar o logo")}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP ou GIF — máx. 2 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ou cole a URL do logo</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/logo.png"
                    value={form.logo}
                    onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                    className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use a URL se o upload não estiver disponível (ex.: sem BLOB_READ_WRITE_TOKEN).</p>
                </div>
                {(logoPreview || (form.logo && !logoFile)) && (
                  <div className="relative inline-block">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                      <img
                        src={logoPreview || form.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs hover:bg-black"
                    >
                      Trocar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 lg:mb-2">Telefone</label>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500 max-w-xs"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] disabled:opacity-50 hover:bg-amber-400 transition-colors w-full sm:w-auto"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>

          {/* Coluna direita: só endereço, sem caixa */}
          <div className="space-y-3 lg:space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-300">Endereço</p>
              <p className="text-xs text-gray-500 mt-0.5">Digite o CEP para preencher automaticamente. Depois informe logradouro e número.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={form.addressCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500 pr-10"
                    maxLength={9}
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {cepError && <p className="text-red-400 text-xs mt-1">{cepError}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida..."
                  value={form.addressLogradouro}
                  onChange={(e) => setForm((f) => ({ ...f, addressLogradouro: e.target.value }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Número</label>
                <input
                  type="text"
                  placeholder="Nº"
                  value={form.addressNumero}
                  onChange={(e) => setForm((f) => ({ ...f, addressNumero: e.target.value }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Complemento</label>
                <input
                  type="text"
                  placeholder="Sala, apto..."
                  value={form.addressComplemento}
                  onChange={(e) => setForm((f) => ({ ...f, addressComplemento: e.target.value }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={form.addressBairro}
                  onChange={(e) => setForm((f) => ({ ...f, addressBairro: e.target.value }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={form.addressCidade}
                  onChange={(e) => setForm((f) => ({ ...f, addressCidade: e.target.value }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <input
                  type="text"
                  placeholder="UF"
                  value={form.addressEstado}
                  onChange={(e) => setForm((f) => ({ ...f, addressEstado: e.target.value.toUpperCase().slice(0, 2) }))}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500 max-w-[4rem]"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
