"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import SelectDark from "@/components/SelectDark";

type Client = { _id: string; name: string; phone?: string; email?: string };
type Cut = { _id: string; name: string; durationMinutes: number; price: number };
type Appointment = {
  _id: string;
  clientId: Client | string;
  cutId?: Cut | string | null;
  scheduledAt: string;
  status: string;
  total?: number;
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default function AgendamentosPage() {
  const [list, setList] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | Appointment | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    cutId: "",
    scheduledAt: "",
    scheduledTime: "",
    status: "scheduled",
    total: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [addClientForm, setAddClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    preferenciaCorte: "",
    tipoCabelo: "",
  });
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [addClientError, setAddClientError] = useState("");
  const [finishModal, setFinishModal] = useState<Appointment | null>(null);
  const [finishForm, setFinishForm] = useState({ cutId: "", total: "" });
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [earlyConfirmModal, setEarlyConfirmModal] = useState<Appointment | null>(null);
  const [earlyFinishReason, setEarlyFinishReason] = useState("");
  const [cancelModal, setCancelModal] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [clientSelectOpen, setClientSelectOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const clientSelectRef = useRef<HTMLDivElement>(null);

  const TIPOS_CABELO = ["Liso", "Ondulado", "Cacheado", "Crespo", "Outro"];

  const filteredClients = useMemo(() => {
    const search = clientSearch.trim();
    if (!search) return clients;
    const q = search.toLowerCase();
    const qNorm = q.normalize("NFD").replace(/\p{Diacritic}/gu, ""); // sem acentos
    return clients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const nameNorm = name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
      const phone = (c.phone || "").replace(/\D/g, "");
      const phoneQ = q.replace(/\D/g, "");
      const email = (c.email || "").toLowerCase();
      return (
        name.includes(q) ||
        nameNorm.includes(qNorm) ||
        (phoneQ.length > 0 && phone.includes(phoneQ)) ||
        email.includes(q)
      );
    });
  }, [clients, clientSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientSelectRef.current && !clientSelectRef.current.contains(e.target as Node)) {
        setClientSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadClients() {
    return fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []));
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setAddClientLoading(true);
    setAddClientError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addClientForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddClientError(data.error || "Erro ao cadastrar");
        setAddClientLoading(false);
        return;
      }
      await loadClients();
      setForm((f) => ({ ...f, clientId: data._id }));
      setAddClientForm({ name: "", phone: "", email: "", preferenciaCorte: "", tipoCabelo: "" });
      setShowAddClient(false);
    } catch {
      setAddClientError("Erro de conexão.");
    }
    setAddClientLoading(false);
  }

  function loadAppointments() {
    const params = new URLSearchParams();
    if (filterDate) {
      const d = new Date(filterDate);
      d.setHours(0, 0, 0, 0);
      params.set("from", d.toISOString());
      d.setHours(23, 59, 59, 999);
      params.set("to", d.toISOString());
    }
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
      });
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/cuts").then((r) => r.json()),
    ])
      .then(([appointments, clientsData, cutsData]) => {
        setList(Array.isArray(appointments) ? appointments : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setCuts(Array.isArray(cutsData) ? cutsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterStatus]);

  function openNew() {
    const now = new Date();
    setForm({
      clientId: "",
      cutId: "",
      scheduledAt: now.toISOString().slice(0, 10),
      scheduledTime: now.toTimeString().slice(0, 5),
      status: "scheduled",
      total: "",
    });
    setModal("new");
    setError("");
    setClientSearch("");
    setClientSelectOpen(false);
  }

  function openEdit(a: Appointment) {
    const client = typeof a.clientId === "object" ? a.clientId : null;
    const cut = a.cutId && typeof a.cutId === "object" ? a.cutId : null;
    const d = new Date(a.scheduledAt);
    setForm({
      clientId: (client?._id ?? a.clientId) as string,
      cutId: (cut?._id ?? (a.cutId as string) ?? "") as string,
      scheduledAt: d.toISOString().slice(0, 10),
      scheduledTime: d.toTimeString().slice(0, 5),
      status: a.status,
      total: a.total != null ? String(a.total) : "",
    });
    setModal(a);
    setError("");
  }

  function getScheduledDateTime() {
    if (!form.scheduledAt || !form.scheduledTime) return "";
    return `${form.scheduledAt}T${form.scheduledTime}:00`;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const scheduledAt = getScheduledDateTime();
    if (!scheduledAt || !form.clientId) {
      setError("Preencha cliente, data e horário.");
      setSaving(false);
      return;
    }
    const body: Record<string, unknown> = {
      clientId: form.clientId,
      scheduledAt,
      status: form.status,
    };
    if (form.cutId) body.cutId = form.cutId;
    const total = parseFloat(form.total);
    if (!isNaN(total)) body.total = total;

    const url = modal === "new" ? "/api/appointments" : `/api/appointments/${(modal as Appointment)._id}`;
    const method = modal === "new" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }
    setModal(null);
    loadAppointments();
  }

  async function remove(a: Appointment) {
    if (!confirm("Cancelar este agendamento?")) return;
    const res = await fetch(`/api/appointments/${a._id}`, { method: "DELETE" });
    if (res.ok) loadAppointments();
  }

  const EARLY_FINISH_REASONS = [
    { value: "cliente_remarcou", label: "Cliente remarcou" },
    { value: "atendimento_antecipado", label: "Atendimento antecipado" },
    { value: "outro", label: "Outro" },
  ];

  const CANCEL_REASONS = [
    { value: "cliente_desistiu", label: "Cliente desistiu" },
    { value: "reagendado", label: "Reagendado" },
    { value: "outro", label: "Outro" },
  ];

  function openFinish(a: Appointment) {
    if (a.status !== "scheduled") return;
    const isFuture = new Date(a.scheduledAt) > new Date();
    if (isFuture) {
      setEarlyFinishReason("");
      setEarlyConfirmModal(a);
      return;
    }
    openFinishModal(a);
  }

  function openFinishModal(a: Appointment) {
    const cut = a.cutId && typeof a.cutId === "object" ? a.cutId : null;
    setFinishForm({
      cutId: (cut?._id ?? (a.cutId as string) ?? "") as string,
      total: a.total != null ? String(a.total) : "",
    });
    setFinishModal(a);
    setFinishError("");
  }

  function confirmEarlyAndOpenFinish() {
    if (!earlyConfirmModal) return;
    openFinishModal(earlyConfirmModal);
    setEarlyConfirmModal(null);
  }

  async function handleCancelAppointment() {
    if (!cancelModal) return;
    setCancelLoading(true);
    try {
      const reasonLabel = cancelReason
        ? (CANCEL_REASONS.find((r) => r.value === cancelReason)?.label ?? cancelReason)
        : undefined;
      const res = await fetch(`/api/appointments/${cancelModal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: reasonLabel }),
      });
      if (res.ok) {
        setCancelModal(null);
        setCancelReason("");
        loadAppointments();
      }
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!finishModal) return;
    const cutId = finishForm.cutId.trim();
    const total = parseFloat(finishForm.total.replace(",", "."));
    if (!cutId || isNaN(total) || total < 0) {
      setFinishError("Informe o serviço (corte) e o valor em R$.");
      return;
    }
    setFinishLoading(true);
    setFinishError("");
    try {
      const body: Record<string, unknown> = { status: "completed", cutId, total };
      if (earlyFinishReason) {
        const label = EARLY_FINISH_REASONS.find((r) => r.value === earlyFinishReason)?.label ?? earlyFinishReason;
        body.completionNote = label;
      }
      const res = await fetch(`/api/appointments/${finishModal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFinishError(data.error || "Erro ao finalizar");
        setFinishLoading(false);
        return;
      }
      setFinishModal(null);
      setEarlyFinishReason("");
      loadAppointments();
    } catch {
      setFinishError("Erro de conexão.");
    }
    setFinishLoading(false);
  }

  const clientName = (a: Appointment) => {
    const c = typeof a.clientId === "object" ? a.clientId : null;
    return c?.name ?? "—";
  };
  const cutName = (a: Appointment) => {
    const c = a.cutId && typeof a.cutId === "object" ? a.cutId : null;
    return c?.name ?? "—";
  };

  /** Exibe "Em andamento" quando o horário do agendamento já passou e ainda está como agendado */
  const displayStatus = (a: Appointment) => {
    if (a.status === "scheduled" && new Date(a.scheduledAt) <= new Date()) return "Em andamento";
    return statusLabels[a.status] ?? a.status;
  };

  const isInProgress = (a: Appointment) =>
    a.status === "scheduled" && new Date(a.scheduledAt) <= new Date();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduledAt) >= new Date()
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] hover:bg-amber-400 transition-colors"
        >
          Novo agendamento
        </button>
      </div>

      {/* Notificações no celular */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-6">
        <p className="text-sm font-medium text-amber-400/90 mb-1">Notificações no celular</p>
        <p className="text-sm text-gray-400">
          Use o app no celular e ative as notificações para receber lembretes dos agendamentos. Os
          próximos agendamentos aparecem abaixo para você acompanhar.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
          />
        </div>
        <SelectDark
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos"
          options={[
            { value: "", label: "Todos" },
            ...Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
      </div>

      {/* Próximos (destaque) */}
      {upcoming.length > 0 && !filterDate && !filterStatus && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Próximos agendamentos</h2>
          <ul className="space-y-2">
            {upcoming.slice(0, 5).map((a) => (
              <li
                key={a._id}
                className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailAppointment(a)}
                  onKeyDown={(e) => e.key === "Enter" && setDetailAppointment(a)}
                  className="cursor-pointer hover:opacity-90 min-w-0 flex-1"
                >
                  <p className="font-medium">{clientName(a)}</p>
                  <p className="text-sm text-gray-400">
                    {cutName(a)} ·{" "}
                    {new Date(a.scheduledAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.total != null && ` · R$ ${Number(a.total).toFixed(2)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{displayStatus(a)}</p>
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => openFinish(a)}
                    className="px-3 py-2 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] text-sm hover:bg-amber-400"
                  >
                    Finalizar atendimento
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCancelModal(a); setCancelReason(""); }}
                    className="px-3 py-2 rounded-lg border border-gray-500 text-gray-300 min-h-[44px] text-sm hover:bg-white/5"
                  >
                    Cancelar agendamento
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="px-3 py-2 rounded-lg border border-gray-600 min-h-[44px] text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    className="px-3 py-2 rounded-lg border border-red-500/50 text-red-400 min-h-[44px] text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-300 mb-3">
        {filterStatus === "completed"
          ? "Atendimentos realizados"
          : filterDate || filterStatus
            ? "Resultados"
            : "Todos os agendamentos"}
      </h2>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-gray-400">
          Nenhum agendamento. Cadastre clientes e cortes para criar o primeiro.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a._id}
              className="p-4 rounded-lg border border-gray-700 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDetailAppointment(a)}
                onKeyDown={(e) => e.key === "Enter" && setDetailAppointment(a)}
                className="cursor-pointer hover:opacity-90 min-w-0 flex-1"
              >
                <p className="font-medium">{clientName(a)}</p>
                <p className="text-sm text-gray-400">
                  {cutName(a)} ·{" "}
                  {new Date(a.scheduledAt).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {a.total != null && ` · R$ ${Number(a.total).toFixed(2)}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">{displayStatus(a)}</p>
              </div>
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {a.status === "scheduled" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openFinish(a)}
                      className="px-3 py-2 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] hover:bg-amber-400"
                    >
                      Finalizar atendimento
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCancelModal(a); setCancelReason(""); }}
                      className="px-3 py-2 rounded-lg border border-gray-500 text-gray-300 min-h-[44px] hover:bg-white/5"
                    >
                      Cancelar agendamento
                    </button>
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
                  </>
                )}
                {a.status === "completed" && (
                  <span className="text-sm text-gray-500 py-2">Clique no agendamento para ver detalhes</span>
                )}
                {a.status !== "scheduled" && a.status !== "completed" && (
                  <>
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
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal Detalhes do agendamento */}
      {detailAppointment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[56] overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-4">Detalhes do agendamento</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">Cliente</p>
                <p className="font-medium text-white">{clientName(detailAppointment)}</p>
                {typeof detailAppointment.clientId === "object" && detailAppointment.clientId?.phone && (
                  <p className="text-gray-400 mt-0.5">{detailAppointment.clientId.phone}</p>
                )}
                {typeof detailAppointment.clientId === "object" && detailAppointment.clientId?.email && (
                  <p className="text-gray-400">{detailAppointment.clientId.email}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Serviço</p>
                <p className="text-white">{cutName(detailAppointment)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Data e horário</p>
                <p className="text-white">
                  {new Date(detailAppointment.scheduledAt).toLocaleString("pt-BR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {detailAppointment.total != null && (
                <div>
                  <p className="text-gray-500 mb-0.5">Valor</p>
                  <p className="text-white">R$ {Number(detailAppointment.total).toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 mb-0.5">Status</p>
                <p className="text-white font-medium">{displayStatus(detailAppointment)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => setDetailAppointment(null)}
                className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
              >
                Fechar
              </button>
              {detailAppointment.status === "scheduled" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setDetailAppointment(null); openFinish(detailAppointment); }}
                    className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] hover:bg-amber-400"
                  >
                    Finalizar atendimento
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDetailAppointment(null); setCancelModal(detailAppointment); setCancelReason(""); }}
                    className="px-4 py-3 rounded-lg border border-gray-500 text-gray-300 min-h-[44px] hover:bg-white/5"
                  >
                    Cancelar agendamento
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDetailAppointment(null); openEdit(detailAppointment); }}
                    className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDetailAppointment(null); remove(detailAppointment); }}
                    className="px-4 py-3 rounded-lg border border-red-500/50 text-red-400 min-h-[44px] hover:bg-red-500/10"
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar finalização antecipada */}
      {earlyConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[56] overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-2">Finalizar atendimento antecipado</h2>
            <p className="text-sm text-gray-400 mb-4">
              Este agendamento ainda não está no horário. Deseja finalizar mesmo assim?
            </p>
            <div className="space-y-4">
              <SelectDark
                label="Motivo (opcional)"
                value={earlyFinishReason}
                onChange={setEarlyFinishReason}
                placeholder="Selecione o motivo"
                options={EARLY_FINISH_REASONS}
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setEarlyConfirmModal(null); setEarlyFinishReason(""); }}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={confirmEarlyAndOpenFinish}
                  className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px]"
                >
                  Sim, continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar agendamento */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[56] overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-2">Cancelar agendamento</h2>
            <p className="text-sm text-gray-400 mb-4">
              Cliente: <span className="text-white font-medium">{clientName(cancelModal)}</span>
              {" · "}
              {new Date(cancelModal.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <div className="space-y-4">
              <SelectDark
                label="Motivo (opcional)"
                value={cancelReason}
                onChange={setCancelReason}
                placeholder="Selecione o motivo"
                options={[
                  { value: "", label: "Selecione (opcional)" },
                  ...CANCEL_REASONS,
                ]}
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setCancelModal(null); setCancelReason(""); }}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="px-4 py-3 rounded-lg bg-red-600 text-white font-medium min-h-[44px] hover:bg-red-500 disabled:opacity-50"
                >
                  {cancelLoading ? "Cancelando…" : "Sim, cancelar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalizar atendimento */}
      {finishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[55] overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-1">Finalizar atendimento</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cliente: <span className="text-white font-medium">{clientName(finishModal)}</span>
            </p>
            <form onSubmit={handleFinish} className="space-y-4">
              {finishError && <p className="text-red-400 text-sm">{finishError}</p>}
              <SelectDark
                label="Serviço (corte) *"
                value={finishForm.cutId}
                onChange={(v) => {
                  const cut = cuts.find((c) => c._id === v);
                  setFinishForm((f) => ({
                    ...f,
                    cutId: v,
                    total: cut && !f.total ? String(cut.price) : f.total,
                  }));
                }}
                placeholder="Selecione o serviço"
                options={cuts.map((c) => ({
                  value: c._id,
                  label: `${c.name} · R$ ${Number(c.price).toFixed(2)}`,
                }))}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={finishForm.total}
                  onChange={(e) => setFinishForm((f) => ({ ...f, total: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setFinishModal(null); setFinishError(""); }}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={finishLoading}
                  className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] disabled:opacity-50"
                >
                  {finishLoading ? "Finalizando…" : "Finalizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastrar cliente (dentro do fluxo de agendamento) */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-1">Cadastrar cliente</h2>
            <p className="text-sm text-gray-500 mb-4">Preencha os dados para agendar.</p>
            <form onSubmit={handleAddClient} className="space-y-4">
              {addClientError && <p className="text-red-400 text-sm">{addClientError}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                <input
                  required
                  placeholder="Nome completo"
                  value={addClientForm.name}
                  onChange={(e) => setAddClientForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={addClientForm.phone}
                    onChange={(e) => setAddClientForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={addClientForm.email}
                    onChange={(e) => setAddClientForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                  />
                </div>
              </div>
              <SelectDark
                label="Tipo de cabelo"
                value={addClientForm.tipoCabelo}
                onChange={(v) => setAddClientForm((f) => ({ ...f, tipoCabelo: v }))}
                placeholder="Selecione"
                options={TIPOS_CABELO.map((t) => ({ value: t, label: t }))}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Preferência de corte</label>
                <input
                  placeholder="Ex.: degradê, social, máquina 2, etc."
                  value={addClientForm.preferenciaCorte}
                  onChange={(e) => setAddClientForm((f) => ({ ...f, preferenciaCorte: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-3 rounded-lg border border-gray-600 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addClientLoading}
                  className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] disabled:opacity-50"
                >
                  {addClientLoading ? "Salvando…" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-bold mb-4">
              {modal === "new" ? "Novo agendamento" : "Editar agendamento"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cliente *</label>
                {clients.length === 0 ? (
                  <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/10">
                    <p className="text-sm text-gray-300 mb-3">Nenhum cliente cadastrado. Cadastre um para agendar.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddClient(true)}
                      className="w-full py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px]"
                    >
                      Cadastrar cliente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2" ref={clientSelectRef}>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setClientSelectOpen(!clientSelectOpen);
                          if (!clientSelectOpen) setClientSearch("");
                        }}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-left text-white min-h-[44px] flex items-center justify-between gap-2"
                        aria-haspopup="listbox"
                        aria-expanded={clientSelectOpen}
                      >
                        <span className={form.clientId ? "" : "text-gray-500"}>
                          {form.clientId
                            ? (() => {
                                const c = clients.find((x) => x._id === form.clientId);
                                return c ? `${c.name}${c.phone ? ` · ${c.phone}` : ""}` : "Selecione";
                              })()
                            : "Selecione"}
                        </span>
                        <span className="text-gray-500 shrink-0">{clientSelectOpen ? "▲" : "▼"}</span>
                      </button>
                      {clientSelectOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-gray-700">
                            <input
                              type="search"
                              autoComplete="off"
                              placeholder="Buscar por nome, telefone ou email..."
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") e.preventDefault();
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-600 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              autoFocus
                            />
                          </div>
                          <ul className="max-h-52 overflow-auto py-1" role="listbox" key={`search-${clientSearch}`}>
                            {filteredClients.length === 0 ? (
                              <li className="px-4 py-3 text-gray-500 text-sm">
                                Nenhum cliente encontrado.
                              </li>
                            ) : (
                              filteredClients.map((c) => (
                                <li
                                  key={c._id}
                                  role="option"
                                  aria-selected={c._id === form.clientId}
                                  onClick={() => {
                                    setForm((f) => ({ ...f, clientId: c._id }));
                                    setClientSelectOpen(false);
                                    setClientSearch("");
                                  }}
                                  className={`px-4 py-3 cursor-pointer min-h-[44px] flex items-center ${
                                    c._id === form.clientId
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "text-white hover:bg-white/10"
                                  }`}
                                >
                                  {c.name}
                                  {c.phone ? ` · ${c.phone}` : ""}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddClient(true)}
                      className="text-sm text-amber-400 hover:text-amber-300"
                    >
                      + Cadastrar outro cliente
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Serviço (corte)</label>
                <p className="text-xs text-gray-500 mb-1">Opcional – pode ser definido ao final do atendimento.</p>
                <SelectDark
                  value={form.cutId}
                  onChange={(v) => {
                    const cut = cuts.find((c) => c._id === v);
                    setForm((f) => ({
                      ...f,
                      cutId: v,
                      total:
                        cut && !f.total
                          ? Number(cut.price ?? 0).toFixed(2)
                          : f.total,
                    }));
                  }}
                  placeholder="Definir ao final (opcional)"
                  options={[
                    { value: "", label: "Definir ao final (opcional)" },
                    ...cuts.map((c) => ({
                      value: c._id,
                      label: `${c.name} · R$ ${Number(c.price).toFixed(2)}`,
                    })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={form.scheduledTime}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
                <p className="text-xs text-gray-500 mb-1">Opcional – definir ao final do serviço.</p>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Definir ao final (opcional)"
                  value={form.total}
                  onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-white min-h-[44px] placeholder-gray-500"
                />
              </div>
              {modal !== "new" && (
                <SelectDark
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))}
                />
              )}
              <div className="flex gap-2 justify-end pt-2">
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
                  className="px-4 py-3 rounded-lg bg-amber-500 text-black font-medium min-h-[44px] disabled:opacity-50"
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
