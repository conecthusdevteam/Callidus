import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { type Cautela, type StatusCautela } from "../data/cautelaTypes";
import {
  approveCautela,
  getCautelas,
  rejectCautela,
  authorizeDeparture,
} from "../lib/api";
import {
  ModalAprovado,
  ModalRecusado,
  ModalDescartar,
  ModalAutorizarSaida,
} from "../components/ModalGestor";

type Tab = "recebidas" | "historico";
type MobileView =
  | "lista"
  | "detalhe"
  | "confirmacao-aprovado"
  | "confirmacao-recusado";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
}

// ── Painel de detalhes da cautela ──
function DetalhesConteudo({
  cautela,
  onAutorizarSaida,
}: {
  cautela: CautelaComDecisao;
  onAutorizarSaida?: () => void;
}) {
  const statusExibido =
    cautela.decisaoLocal === "aprovado"
      ? "Aprovado"
      : cautela.decisaoLocal === "reprovado"
        ? "Reprovado"
        : cautela.status;

  const isSomenteLeitura =
    cautela.decisaoLocal !== undefined ||
    cautela.status === "Aprovado" ||
    cautela.status === "Reprovado" ||
    cautela.status === "Saída Autorizada" ||
    cautela.status === "Encerrada";

  return (
    <div>
      {isSomenteLeitura && (
        <div className="mb-4">
          {cautela.status !== "Saída Autorizada" &&
            cautela.status !== "Encerrada" &&
            cautela.status !== "Aprovado" &&
            cautela.status !== "Reprovado" && (
              <StatusBadge status={statusExibido as StatusCautela} fullWidth />
            )}
          {cautela.status === "Aprovado" && (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#BCF0DA] border border-[#31C48D] text-[#065F46] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Aprovado {cautela.aprovadoEm ? `em ${cautela.aprovadoEm}` : ""}
            </div>
          )}
          {cautela.status === "Saída Autorizada" && (
            <div className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Aguardando saída
            </div>
          )}
          {cautela.status === "Reprovado" && (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FBD5D5] border border-[#F05252] text-[#9B1C1C] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Reprovado {cautela.reprovadoEm ? `em ${cautela.reprovadoEm}` : ""}
            </div>
          )}
          {cautela.status === "Encerrada" && (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#F4F4F4] border border-[#A3A3A3] text-[#525252] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Encerrada {cautela.encerradaEm ? `em ${cautela.encerradaEm}` : ""}
            </div>
          )}
          {(cautela.motivoNegativa || cautela.decisaoLocal === "reprovado") && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Justificativa:
              </p>
              <p className="text-sm text-red-700">
                {cautela.motivoNegativa ?? "—"}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="mb-4">
        <p className="text-base font-bold text-black">Id da cautela</p>
        <p className="text-base text-black">{cautela.id}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">Setor:</p>
        <p className="text-base text-black">{cautela.empresa}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">Data e hora de entrada</p>
        <p className="text-base text-black">{cautela.data}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">Propriedade</p>
        <p className="text-base text-black">{cautela.visitante}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">E-mail do proprietário</p>
        <p className="text-base text-black">{cautela.proprietarioEmail}</p>
      </div>
      {cautela.validade && (
        <div className="mb-4">
          <p className="text-sm font-bold text-black">Válido até:</p>
          <p className="text-sm text-gray-700">{cautela.validade}</p>
        </div>
      )}
      {cautela.aprovadoEm && (
        <div className="mb-4">
          <p className="text-sm font-bold text-black">Aprovado em:</p>
          <p className="text-sm text-gray-700">{cautela.aprovadoEm}</p>
        </div>
      )}
      {cautela.status === "Encerrada" && cautela.encerradaEm && (
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Data e hora de saída:</p>
          <p className="text-sm text-gray-700">{cautela.encerradaEm}</p>
        </div>
      )}
      <table className="w-full mt-16 mb-2 overflow-hidden">
        <thead>
          <tr style={{ backgroundColor: "#0E9F6E" }}>
            <th className="px-4 py-2 text-left text-white text-base font-bold">
              Descrição
            </th>
            <th className="px-4 py-2 text-center text-white text-base font-bold">
              Quantidade
            </th>
          </tr>
        </thead>
        <tbody>
          {cautela.equipamentos.map((eq, i) => (
            <tr key={i} className="border-b border-gray-100 even:bg-[#F4F4F4]">
              <td className="px-4 py-3 text-sm text-[#0A0A0A]">
                {eq.descricao}
              </td>
              <td className="px-4 py-3 text-center text-sm text-[#0A0A0A]">
                {eq.quantidade ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cautela.status === "Aprovado" &&
        cautela.decisaoLocal === undefined &&
        onAutorizarSaida && (
          <button
            onClick={onAutorizarSaida}
            className="w-full mt-12 py-2.5 rounded-lg bg-[#F5F5F5] text-black text-sm font-semibold hover:bg-gray-300 transition-colors"
          >
            Autorizar saída
          </button>
        )}
    </div>
  );
}

// ── Card da lista de recebidas ──
function CardCautela({
  cautela,
  index,
  isNaoLida,
  onClick,
  onAprovar,
  onDescartar,
}: {
  cautela: CautelaComDecisao;
  index: number;
  isNaoLida: boolean;
  onClick: () => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
}) {
  // Amarelo se não lida, borda amarela se for a primeira
  const borderClass = isNaoLida
    ? "border-2 border-amber-400 bg-[#FFFBEB]"
    : index === 0
      ? "border-2 border-yellow-300 bg-white"
      : "border border-black bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-sm p-5 cursor-pointer transition-all ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-[#404040]">
          Id Cautela: <span className="font-medium">{cautela.id}</span>
        </span>
        <span className="text-[13px] text-[#404040]">Data: {cautela.data}</span>
      </div>
      <div className="mb-2">
        <span className="text-[13px] text-[#404040]">
          Solicitada:{" "}
          <span className="font-bold">{cautela.visitante.toUpperCase()}</span>
        </span>
      </div>
      {isNaoLida && (
        <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mb-2">
          Nova
        </span>
      )}
      <hr className="border-black mb-3" />
      <p className="text-sm font-medium text-[#404040] mb-1">Cautelados:</p>
      <ul className="mb-4 space-y-0.5">
        {cautela.equipamentos.map((eq, i) => (
          <li
            key={i}
            className="text-sm text-[#404040] flex items-start gap-1.5"
          >
            <span className="mt-0.5">-</span>
            {eq.descricao} - {eq.quantidade ?? 1}
          </li>
        ))}
      </ul>
      <div
        className="flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <button
            onClick={() => onAprovar(cautela.id)}
            className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
          >
            Aprovar
          </button>
          <button
            onClick={() => onDescartar(cautela.id)}
            className="px-5 py-2 rounded-lg bg-white border border-gray-400 text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Descartar
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-[13px] px-4 py-2 bg-gray-100 rounded-lg text-[#171717] font-medium hover:underline"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

function CardHistorico({
  cautela,
  onClick,
}: {
  cautela: CautelaComDecisao;
  onClick: () => void;
}) {
  const statusExibido =
    cautela.decisaoLocal === "aprovado"
      ? "Aprovado"
      : cautela.decisaoLocal === "reprovado"
        ? "Reprovado"
        : cautela.status === "Saída Autorizada"
          ? "Aprovado"
          : cautela.status;

  const avatar =
    cautela.status === "Aprovado" || cautela.status === "Saída Autorizada" ? (
      <div className="w-12 h-12 rounded-full bg-[#D1FAE5] border border-[#31C48D] flex items-center justify-center flex-shrink-0">
        <svg
          className="w-6 h-6 text-[#2B8E37]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    ) : cautela.status === "Reprovado" ? (
      <div className="w-12 h-12 rounded-full bg-[#FEE2E2] border border-[#F05252] flex items-center justify-center flex-shrink-0">
        <svg
          className="w-6 h-6 text-[#E02424]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    ) : (
      <div className="w-12 h-12 rounded-full bg-[#F4F4F4] border border-[#A3A3A3] flex items-center justify-center flex-shrink-0">
        <svg
          className="w-6 h-6 text-[#525252]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 border border-[#D1D5DB] bg-white"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar}
          <p className="text-[16px] font-bold leading-tight text-[#404040]">
            {cautela.visitante || "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          <StatusBadge status={statusExibido as StatusCautela} />
          {cautela.status === "Saída Autorizada" && (
            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-100 text-amber-800 border border-amber-400">
              ⚠ Aguardando saída
            </span>
          )}
        </div>
      </div>

      <p className="text-[14px] text-[#404040] mt-1">
        Data: {cautela.data || "—"}
      </p>
      <p className="text-[14px] text-[#404040] mt-0.5">
        Ciente:{" "}
        <span className="font-bold">
          {(cautela.gestor || "").toUpperCase()}
        </span>
      </p>

      <div className="border-t border-gray-200 my-3" />

      <p className="text-[13px] font-medium text-[#404040] mb-1">Cautelados:</p>
      <ul className="space-y-0.5 mb-3">
        {cautela.equipamentos?.slice(0, 3).map((eq, i) => (
          <li
            key={i}
            className="text-[13px] text-[#404040] flex items-center gap-1.5"
          >
            <span className="text-[#6B7280]">•</span>
            {eq.descricao} - {eq.quantidade ?? 1}
          </li>
        ))}
        {(cautela.equipamentos?.length ?? 0) > 3 && (
          <li className="text-[12px] text-[#9CA3AF]">
            +{cautela.equipamentos.length - 3} item(ns)
          </li>
        )}
      </ul>

      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-[13px] px-4 py-2 bg-gray-100 rounded-lg text-[#171717] font-medium hover:underline"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string[]> = {
  "Em análise": ["em análise", "analise", "análise", "pendente"],
  Aprovado: ["aprovado", "aprovada"],
  Reprovado: ["reprovado", "reprovada", "negado", "recusado"],
  "Saída Autorizada": [
    "saída autorizada",
    "saida autorizada",
    "aguardando saída",
    "aguardando saida",
  ],
  Encerrada: ["encerrada", "encerrado", "finalizada", "concluida"],
};

function matchesSearch(cautela: Cautela, term: string): boolean {
  if (!term.trim()) return true;
  const q = term.toLowerCase().trim();
  if (cautela.id.toLowerCase().includes(q)) return true;
  if (cautela.visitante?.toLowerCase().includes(q)) return true;
  if (cautela.gestor?.toLowerCase().includes(q)) return true;
  if (cautela.empresa?.toLowerCase().includes(q)) return true;
  const variants = STATUS_LABELS[cautela.status] ?? [];
  if (variants.some((v) => v.includes(q) || q.includes(v))) return true;
  return false;
}

export default function Gestor() {
  const [activeTab, setActiveTab] = useState<Tab>("recebidas");
  const [cautelas, setCautelas] = useState<CautelaComDecisao[]>([]);
  const [cautelaSelecionada, setCautelaSelecionada] =
    useState<CautelaComDecisao | null>(null);
  const [modalDescartar, setModalDescartar] = useState(false);
  const [modalAprovado, setModalAprovado] = useState(false);
  const [modalRecusado, setModalRecusado] = useState(false);
  const [actionError, setActionError] = useState("");
  const [modalAutorizarSaida, setModalAutorizarSaida] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("lista");
  const [searchTerm, setSearchTerm] = useState("");

  // IDs de cautelas de Recebidas já vistas
  const [cautelasLidas, setCautelasLidas] = useState<Set<string>>(new Set());
  const [recebidasLidas, setRecebidasLidas] = useState<Set<string>>(new Set());

  const carregarCautelas = useCallback(async () => {
    try {
      const data = await getCautelas();
      setCautelas(data);
    } catch (error) {
      console.error("Erro ao carregar cautelas.", error);
      setCautelas([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarCautelas();
    const interval = setInterval(() => void carregarCautelas(), 20000);
    return () => clearInterval(interval);
  }, [carregarCautelas]);

  const recebidas = cautelas.filter((c) => {
    const passaStatus = c.status === "Em análise" && !c.decisaoLocal;
    if (!searchTerm.trim()) return passaStatus;
    return passaStatus && matchesSearch(c, searchTerm);
  });

  const historico = cautelas.filter((c) => {
    const passaStatus =
      !!c.decisaoLocal ||
      c.status === "Aprovado" ||
      c.status === "Reprovado" ||
      c.status === "Saída Autorizada" ||
      c.status === "Encerrada";
    if (!searchTerm.trim()) return passaStatus;
    return passaStatus && matchesSearch(c, searchTerm);
  });

  useEffect(() => {
    function onSelecionar(e: Event) {
      const cautela = (e as CustomEvent<{ cautela: Cautela }>).detail.cautela;
      const cautelaCompleta =
        cautelas.find((c) => c.id === cautela.id) ?? cautela;
      abrirDetalhe(cautelaCompleta as CautelaComDecisao);
      if (cautelaCompleta.status !== "Em análise") {
        setActiveTab("historico");
      }
    }
    window.addEventListener("cautela-selecionar", onSelecionar);
    return () => window.removeEventListener("cautela-selecionar", onSelecionar);
  }, [cautelas]);

  useEffect(() => {
    function onAcao(e: Event) {
      const { acao, id } = (e as CustomEvent<{ acao: string; id: string }>)
        .detail;
      if (acao === "aprovar") void aprovar(id);
      if (acao === "descartar") abrirDescartar(id);
    }
    window.addEventListener("cautela-acao", onAcao);
    return () => window.removeEventListener("cautela-acao", onAcao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cautelas]);

  useEffect(() => {
    function onSearch(e: Event) {
      const term = (e as CustomEvent<{ term: string }>).detail.term;
      setSearchTerm(term);
      if (term.trim()) {
        const encontrada = cautelas.find((c) => matchesSearch(c, term));
        if (encontrada) {
          if (encontrada.status !== "Em análise") setActiveTab("historico");
          else setActiveTab("recebidas");
        }
      }
    }
    window.addEventListener("cautela-search", onSearch);
    return () => window.removeEventListener("cautela-search", onSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cautelas]);

  const isSomenteLeitura = (c: CautelaComDecisao) =>
    c.decisaoLocal !== undefined ||
    c.status === "Aprovado" ||
    c.status === "Reprovado" ||
    c.status === "Saída Autorizada" ||
    c.status === "Encerrada";

  function abrirDetalhe(cautela: CautelaComDecisao) {
    setCautelaSelecionada(cautela);
    setCautelasLidas((prev) => new Set([...prev, cautela.id]));
    setRecebidasLidas((prev) => new Set([...prev, cautela.id]));
  }

  const totalRecebidasNaoLidas = recebidas.filter(
    (c) => !recebidasLidas.has(c.id),
  ).length;
  const mostrarBolinhaGestor = totalRecebidasNaoLidas > 0;

  async function aprovar(id: string) {
    try {
      setActionError("");
      const cautelaAtualizada = await approveCautela(id);
      setCautelas((prev) =>
        prev.map((c) => (c.id === id ? cautelaAtualizada : c)),
      );
    } catch (error) {
      console.error("Erro ao aprovar cautela.", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel aprovar a cautela.",
      );
      return;
    } finally {
      setCautelaSelecionada(null);
      setMobileView("lista");
    }
    setModalAprovado(true);
  }

  function abrirDescartar(id: string) {
    setCautelaSelecionada(cautelas.find((c) => c.id === id) ?? null);
    setModalDescartar(true);
  }

  async function handleAutorizarSaida(id: string) {
    try {
      setActionError("");
      const cautelaAtualizada = await authorizeDeparture(id);
      setCautelas((prev) =>
        prev.map((c) => (c.id === id ? cautelaAtualizada : c)),
      );
      setCautelaSelecionada((prev) =>
        prev?.id === id ? cautelaAtualizada : prev,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível autorizar a saída.",
      );
      return;
    }
    setModalAutorizarSaida(true);
  }

  async function confirmarDescartar(justificativa: string) {
    if (cautelaSelecionada) {
      try {
        setActionError("");
        const cautelaAtualizada = await rejectCautela(
          cautelaSelecionada.id,
          justificativa,
        );
        setCautelas((prev) =>
          prev.map((c) =>
            c.id === cautelaSelecionada.id ? cautelaAtualizada : c,
          ),
        );
      } catch (error) {
        console.error("Erro ao reprovar cautela.", error);
        setActionError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel reprovar a cautela.",
        );
        setModalDescartar(false);
        return;
      }
    }
    setModalDescartar(false);
    setCautelaSelecionada(null);
    setModalRecusado(true);
    setMobileView("lista");
  }

  return (
    <>
      {/* ══════════════ MOBILE ══════════════ */}
      <div className="md:hidden flex flex-col h-screen pt-[90px] bg-white">
        {actionError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}
        {mobileView === "lista" && (
          <>
            <div className="relative top-6 mx-4">
              <button
                onClick={() => setActiveTab("historico")}
                className={`w-full h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all ${activeTab === "historico" ? "bg-[#22592A] text-white" : "bg-[#C4EEC9] text-[#2B8E37]"}`}
                style={{ paddingLeft: "50%" }}
              >
                Histórico
              </button>
              <button
                onClick={() => {
                  setActiveTab("recebidas");
                  setRecebidasLidas((prev) => {
                    const novo = new Set(prev);
                    recebidas.forEach((c) => novo.add(c.id));
                    return novo;
                  });
                }}
                className={`absolute top-0 left-0 w-1/2 h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
                  activeTab === "recebidas"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
              >
                <div className="flex items-center justify-center gap-2 w-full h-full">
                  <span>Recebidas</span>
                  {totalRecebidasNaoLidas > 0 && (
                    <div className="relative flex-shrink-0">
                      <div
                        className="min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                        style={{ backgroundColor: "#0E9F6E" }}
                      >
                        {totalRecebidasNaoLidas > 9
                          ? "9+"
                          : totalRecebidasNaoLidas}
                      </div>
                      {mostrarBolinhaGestor && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === "recebidas" && (
                <div className="py-8 mx-4 flex flex-col gap-4">
                  {recebidas.length === 0 && (
                    <p className="text-sm text-gray-400 text-center mt-10">
                      Nenhuma cautela.
                    </p>
                  )}
                  {recebidas.map((cautela, index) => (
                    <CardCautela
                      key={cautela.id}
                      cautela={cautela}
                      index={index}
                      isNaoLida={!cautelasLidas.has(cautela.id)}
                      onClick={() => {
                        abrirDetalhe(cautela);
                        setMobileView("detalhe");
                      }}
                      onAprovar={aprovar}
                      onDescartar={abrirDescartar}
                    />
                  ))}
                </div>
              )}

              {activeTab === "historico" && (
                <div className="py-8 mx-4 flex flex-col gap-2">
                  {historico.length === 0 && (
                    <p className="text-sm text-gray-400 text-center mt-10">
                      Nenhuma cautela.
                    </p>
                  )}
                  {historico.map((cautela) => (
                    <CardHistorico
                      key={cautela.id}
                      cautela={cautela}
                      onClick={() => {
                        abrirDetalhe(cautela);
                        setMobileView("detalhe");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {mobileView === "detalhe" && cautelaSelecionada && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative flex items-center justify-center px-4 py-3 mt-2">
              <button
                onClick={() => setMobileView("lista")}
                className="absolute left-4 text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="font-bold text-[20px] text-center">
                Visualização de Cautela
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
              <div className="bg-white rounded-sm border border-black p-6">
                <DetalhesConteudo
                  cautela={cautelaSelecionada}
                  onAutorizarSaida={() =>
                    handleAutorizarSaida(cautelaSelecionada.id)
                  }
                />
              </div>
              {!isSomenteLeitura(cautelaSelecionada) && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => aprovar(cautelaSelecionada.id)}
                    className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A]"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => abrirDescartar(cautelaSelecionada.id)}
                    className="w-full py-2.5 rounded-lg border border-black bg-white text-black text-sm font-medium hover:bg-gray-100"
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mobileView === "confirmacao-aprovado" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center gap-4 w-full">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#EEF5EE" }}
              >
                <div className="w-10 h-10 rounded-full border-2 border-[#2B8E37] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#2B8E37]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-base font-bold text-black text-center">
                Sua resposta foi enviada ao solicitante
              </p>
            </div>
            <button
              onClick={() => setMobileView("lista")}
              className="w-full py-3 rounded-xl bg-[#2B8E37] text-white font-semibold text-sm"
            >
              Voltar à tela inicial
            </button>
          </div>
        )}
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden md:flex h-screen pt-[60px] pl-[70px] bg-white overflow-hidden">
        {actionError && (
          <div className="fixed left-[90px] right-5 top-[76px] z-40 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {/* Painel esquerdo — Recebidas */}
        <div className="w-xl h-screen flex-shrink-0 flex flex-col overflow-hidden pt-[20px]">
          <div
            className="bg-[#22592A] px-5 py-4 flex-shrink-0 rounded-t-lg mx-4 mt-4 flex items-center justify-between"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-base">Recebidas</h2>
            {totalRecebidasNaoLidas > 0 && (
              <div className="relative flex-shrink-0">
                <div
                  className="min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-white text-[13px] font-bold leading-none"
                  style={{ backgroundColor: "#0E9F6E" }}
                >
                  {totalRecebidasNaoLidas > 9 ? "9+" : totalRecebidasNaoLidas}
                </div>
                {mostrarBolinhaGestor && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                )}
              </div>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto mx-4 mb-4 bg-[#E5E7EB] flex flex-col gap-3 p-6 rounded-b-lg border border-gray-200"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            {recebidas.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                Nenhuma cautela pendente.
              </p>
            )}
            {recebidas.map((cautela, index) => (
              <CardCautela
                key={cautela.id}
                cautela={cautela}
                index={index}
                isNaoLida={!cautelasLidas.has(cautela.id)}
                onClick={() => abrirDetalhe(cautela)}
                onAprovar={aprovar}
                onDescartar={abrirDescartar}
              />
            ))}
          </div>
        </div>

        {/* Área central */}
        {cautelaSelecionada ? (
          <div className="flex-1 flex flex-col overflow-hidden pt-14 mb-4 px-2">
            <div className="flex-1 overflow-y-auto bg-white border border-black rounded-sm p-6">
              <DetalhesConteudo
                cautela={cautelaSelecionada}
                onAutorizarSaida={() =>
                  handleAutorizarSaida(cautelaSelecionada.id)
                }
              />
            </div>
            {!isSomenteLeitura(cautelaSelecionada) && (
              <div className="flex gap-3 justify-center pt-5 pb-32">
                <button
                  onClick={() => aprovar(cautelaSelecionada.id)}
                  className="px-8 py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#0E9F6E]"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => abrirDescartar(cautelaSelecionada.id)}
                  className="px-8 py-2.5 rounded-lg border border-black bg-white text-black text-sm font-medium hover:bg-gray-100"
                >
                  Descartar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-white" />
        )}

        {/* Painel direito — Histórico */}
        <div className="w-lg h-screen flex-shrink-0 flex flex-col overflow-hidden pt-[20px]">
          <div
            className="bg-[#22592A] pl-5 py-4 flex-shrink-0 rounded-t-lg mx-4 mt-4"
            style={{ boxShadow: "-4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-base">Histórico</h2>
          </div>
          <div
            className="flex-1 overflow-y-auto mx-4 mb-4 bg-[#E5E7EB] rounded-b-lg border border-gray-200 p-3"
            style={{ boxShadow: "-4px 0 8px rgba(0,0,0,0.25)" }}
          >
            {historico.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                Nenhum histórico.
              </p>
            )}
            {historico.map((cautela) => (
              <CardHistorico
                key={cautela.id}
                cautela={cautela}
                onClick={() => abrirDetalhe(cautela)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Modais ── */}
      {modalDescartar && (
        <ModalDescartar
          onConfirmar={confirmarDescartar}
          onCancelar={() => setModalDescartar(false)}
        />
      )}
      {modalAprovado && (
        <ModalAprovado onClose={() => setModalAprovado(false)} />
      )}
      {modalRecusado && (
        <ModalRecusado onClose={() => setModalRecusado(false)} />
      )}
      {modalAutorizarSaida && (
        <ModalAutorizarSaida onClose={() => setModalAutorizarSaida(false)} />
      )}
    </>
  );
}
