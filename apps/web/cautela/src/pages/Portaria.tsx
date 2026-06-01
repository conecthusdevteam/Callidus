import { useCallback, useEffect, useRef, useState } from "react";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import {
  getCautelas,
  closeCautela,
  validateEntry,
  markCautelaAsRead,
} from "../lib/api";
import { useLocation } from "react-router-dom";
import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { BannerStatus, JustificativaBox } from "../components/BannerStatus";
import {
  TabelaCautelados,
  ListaCautelados,
} from "../components/TabelaCautelados";
import { ModalEncerrada } from "../components/ModalGestor";
import { matchesSearch } from "../lib/cautelaUtils";
import DetalhesCautela from "../components/DetalhesCautela";

const STATUS_HISTORICO: StatusCautela[] = [
  "Encerrada",
  "Reprovado",
  "Aprovado",
  "Saída Autorizada",
];
const ITENS_POR_PAGINA = 8;

type MobileView = "lista" | "detalhe";

function isCautelaAtivaPortaria(cautela: Cautela) {
  return (
    cautela.status === "Saída Autorizada" ||
    cautela.etapaFluxo === "APROVADA_PELO_GESTOR"
  );
}

// ─── Badge inline para tabela ─────────────────────────────────────────────────

function BadgeTabela({
  status,
  etapaFluxo,
}: {
  status: StatusCautela;
  etapaFluxo?: string;
}) {
  if (status === "Aprovado" && etapaFluxo === "APROVADA_PELO_GESTOR") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#31C48D] bg-[#BCF0DA] text-[#065F46]">
        <span className="w-2 h-2 rounded-full bg-[#0E9F6E]" />
        Em Validação
      </span>
    );
  }
  if (status === "Aprovado") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#31C48D] bg-[#BCF0DA] text-[#065F46]">
        <span className="w-2 h-2 rounded-full bg-[#0E9F6E]" />
        Ativa
      </span>
    );
  }
  if (status === "Saída Autorizada") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-amber-400 bg-amber-100 text-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        Saída Autorizada
      </span>
    );
  }
  if (status === "Reprovado") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#F05252] bg-[#FEF2F2] text-[#9B1C1C]">
        <span className="w-2 h-2 rounded-full bg-[#F05252]" />
        Reprovado
      </span>
    );
  }
  if (status === "Encerrada") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#A3A3A3] bg-[#F4F4F4] text-[#525252]">
        <span className="w-2 h-2 rounded-full bg-[#A3A3A3]" />
        Encerrada
      </span>
    );
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(valor: string): { data: string; hora: string } {
  if (!valor) return { data: "", hora: "--:--" };
  if (valor.includes(", ")) {
    const [data, hora] = valor.split(", ");
    return { data, hora };
  }
  try {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return { data: valor, hora: "--:--" };
    return {
      data: d.toLocaleDateString("pt-BR"),
      hora: d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { data: valor, hora: "--:--" };
  }
}

function paginasVisiveis(
  pagina: number,
  totalPaginas: number,
): (number | "...")[] {
  if (totalPaginas <= 7)
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (pagina > 3) pages.push("...");
  for (
    let p = Math.max(2, pagina - 1);
    p <= Math.min(totalPaginas - 1, pagina + 1);
    p++
  ) {
    pages.push(p);
  }
  if (pagina < totalPaginas - 2) pages.push("...");
  pages.push(totalPaginas);
  return pages;
}

function CautelaPrint({ cautela }: { cautela: Cautela | null }) {
  if (!cautela) return null;
  const [data = "—", hora = "—"] = cautela.data?.split(", ") ?? [];
  const titulo =
    cautela.status === "Reprovado"
      ? "REPROVADA"
      : cautela.status === "Encerrada"
        ? "ENCERRADA"
        : "APROVADA";
  const responsavelLabel =
    cautela.status === "Reprovado" ? "Reprovado por" : "Aprovado por";

  return (
    <div className="cautela-print-area">
      <div className="cautela-print-card">
        <h1>{titulo}</h1>
        <p className="print-label">Id da Cautela:</p>
        <p className="print-value">{cautela.id}</p>

        <div className="print-grid">
          <div>
            <p className="print-label">Data da solicitação</p>
            <p className="print-value">{data}</p>
          </div>
          <div>
            <p className="print-label">Hora da solicitação</p>
            <p className="print-value">{hora}</p>
          </div>
        </div>

        <p className="print-label">Setor</p>
        <p className="print-value">{cautela.setorId || "-"}</p>
        <p className="print-label">Proprietário:</p>
        <p className="print-value">{cautela.visitante || "-"}</p>
        <p className="print-label">Documento/Matrícula</p>
        <p className="print-value">{cautela.documento || "-"}</p>
        <p className="print-label">Email</p>
        <p className="print-value">{cautela.proprietarioEmail || "-"}</p>
        <p className="print-label">Empresa</p>
        <p className="print-value">{cautela.empresa || "-"}</p>
        <p className="print-label">{responsavelLabel}</p>
        <p className="print-value">{cautela.gestor || "-"}</p>

        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <>
            <p className="print-label">Justificativa</p>
            <p className="print-value">{cautela.motivoNegativa}</p>
          </>
        )}

        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {cautela.equipamentos.map((item, index) => (
              <tr key={`${item.descricao}-${index}`}>
                <td>{item.descricao}</td>
                <td>{item.quantidade ?? 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Banner do card ───────────────────────────────────────────────────────────

function BannerCard({ status }: { status: StatusCautela }) {
  if (status === "Saída Autorizada") {
    return (
      <div className="w-full text-center py-1 px-3 rounded mb-3 bg-amber-100 border border-amber-400 text-amber-800 text-[12px] font-bold uppercase tracking-wide">
        Autorizado a sair
      </div>
    );
  }
  if (status === "Aprovado") {
    return (
      <div className="w-full text-center py-1 px-3 rounded mb-3 bg-[#D1FAE5] border border-[#34D399] text-[#065F46] text-[12px] font-bold uppercase tracking-wide">
        Autorizado a entrar
      </div>
    );
  }
  return null;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CardCautelaPortaria({
  cautela,
  isNaoLida,
  isSelected,
  onClick,
  onAprovarEntrada,
  onAprovarSaida,
}: {
  cautela: Cautela;
  isNaoLida: boolean;
  isSelected: boolean;
  onClick: () => void;
  onAprovarEntrada?: (id: string) => void;
  onAprovarSaida?: (id: string) => void;
}) {
  const status = cautela.status as StatusCautela;
  const borderClass = isSelected
    ? "border-2 border-[#22592A] bg-white"
    : isNaoLida
      ? "border-2 border-amber-300 bg-[#FFFAD8]"
      : status === "Saída Autorizada"
        ? "border border-amber-300 bg-white"
        : status === "Aprovado"
          ? "border border-[#34D399] bg-white"
          : "border border-[#D1D5DB] bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 w-full max-w-[460px] mx-auto ${borderClass}`}
    >
      <BannerCard status={status} />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AvatarStatus status={status} />
          <div>
            <p className="text-[18px] font-bold leading-tight text-[#404040]">
              {cautela.visitante || "Nome do proprietário"}
            </p>
            <p className="text-[15px] text-[#404040] mt-1">
              Data: {cautela.data || "00/00/0000"}
            </p>
            <p className="text-[15px] text-[#404040] mt-0.5">
              Ciente:{" "}
              <span className="font-bold">
                {(cautela.gestor || "").toUpperCase()}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          <BadgeStatus status={status} etapaFluxo={cautela.etapaFluxo} />
          {isNaoLida && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mt-0.5">
              Nova
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-black my-3" />

      <div className="flex justify-between items-end gap-4">
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#404040] mb-1">
            Cautelados:
          </p>
          <ListaCautelados equipamentos={cautela.equipamentos ?? []} max={3} />
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {status === "Aprovado" && onAprovarEntrada && (
            <button
              onClick={() => onAprovarEntrada(cautela.id)}
              className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
            >
              Aprovar entrada
            </button>
          )}
          {status === "Saída Autorizada" && onAprovarSaida && (
            <button
              onClick={() => onAprovarSaida(cautela.id)}
              className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
            >
              Aprovar saída
            </button>
          )}
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

function ultimaAcaoData(cautela: Cautela): string {
  if (cautela.status === "Encerrada" && cautela.encerradaEm)
    return cautela.encerradaEm;
  if (cautela.status === "Saída Autorizada" && cautela.entradaValidadaEm)
    return cautela.entradaValidadaEm;
  if (cautela.status === "Reprovado" && cautela.reprovadoEm)
    return cautela.reprovadoEm;
  if (cautela.status === "Aprovado" && cautela.aprovadoEm)
    return cautela.aprovadoEm;
  return cautela.data;
}

// ─── Painel de detalhes ───────────────────────────────────────────────────────

function DetalhesCautelaPortaria({
  cautela,
  onFechar,
  onAprovarEntrada,
  onAprovarSaida,
}: {
  cautela: Cautela;
  onFechar: () => void;
  onAprovarEntrada?: () => void;
  onAprovarSaida?: () => void;
}) {
  const tipoPermissaoLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "Livre trânsito"
      : "Entrada única";
  const statusFinalizadoLabel =
    cautela.status === "Reprovado" ? "Reprovado" : "Aprovado";
  const statusFinalizadoEm =
    cautela.status === "Reprovado" ? cautela.reprovadoEm : cautela.aprovadoEm;

  return (
    <div className="relative flex flex-col h-full">
      <button
        onClick={onFechar}
        className="absolute right-3 top-3 z-10 text-black hover:text-gray-500"
        aria-label="Fechar detalhes"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <BannerStatus cautela={cautela} />
        </div>
        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <div className="mb-4">
            <JustificativaBox motivo={cautela.motivoNegativa} />
          </div>
        )}
        {cautela.tipoPermissaoAlteradoEm && (
          <p className="mb-4 text-center text-sm font-semibold text-[#404040]">
            {tipoPermissaoLabel}
          </p>
        )}
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Id da cautela</p>
          <p className="text-sm text-gray-700 break-all">{cautela.id}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Setor</p>
          <p className="text-sm text-gray-700">{cautela.setorId || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">
            Data e hora da solicitação
          </p>
          <p className="text-sm text-gray-700">{cautela.data || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Proprietário</p>
          <p className="text-sm text-gray-700">{cautela.visitante || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Documento</p>
          <p className="text-sm text-gray-700">{cautela.documento || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Empresa</p>
          <p className="text-sm text-gray-700">{cautela.empresa || "-"}</p>
        </div>
        {cautela.proprietarioEmail && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              E-mail do proprietário
            </p>
            <p className="text-sm text-gray-700">{cautela.proprietarioEmail}</p>
          </div>
        )}
        {cautela.gestor && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              {statusFinalizadoLabel} por:
            </p>
            <p className="text-sm text-gray-700">{cautela.gestor}</p>
          </div>
        )}
        {statusFinalizadoEm && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              {statusFinalizadoLabel} em:
            </p>
            <p className="text-sm text-gray-700">{statusFinalizadoEm}</p>
          </div>
        )}
        {cautela.validade && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Válido até:</p>
            <p className="text-sm text-gray-700">{cautela.validade}</p>
          </div>
        )}
        {cautela.status === "Encerrada" && cautela.encerradaEm && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              Data e hora de saída:
            </p>
            <p className="text-sm text-gray-700">{cautela.encerradaEm}</p>
          </div>
        )}
        <div className="mb-3">
          <p className="text-sm font-bold text-black mb-2">Cautelados:</p>
          <TabelaCautelados equipamentos={cautela.equipamentos ?? []} />
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
        {cautela.status === "Aprovado" && onAprovarEntrada && (
          <button
            onClick={onAprovarEntrada}
            className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
          >
            Aprovar entrada
          </button>
        )}
        {cautela.status === "Saída Autorizada" && onAprovarSaida && (
          <button
            onClick={onAprovarSaida}
            className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
          >
            Aprovar saída
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="w-full py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}

// ─── Portaria ─────────────────────────────────────────────────────────────────

export default function Portaria() {
  const location = useLocation();

  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [cautelaSelecionada, setCautelaSelecionada] = useState<Cautela | null>(
    () => {
      const state = location.state as { cautelaSelecionada?: Cautela } | null;
      if (state?.cautelaSelecionada) {
        window.history.replaceState({}, "");
        return state.cautelaSelecionada;
      }
      return null;
    },
  );
  const [origemDetalhe, setOrigemDetalhe] = useState<"ativas" | "historico">(
    "ativas",
  );
  const [modalEncerrada, setModalEncerrada] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState("");
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const cautelaSelecionadaRef = useRef<Cautela | null>(null);

  useEffect(() => {
    cautelaSelecionadaRef.current = cautelaSelecionada;
  }, [cautelaSelecionada]);

  const carregarCautelas = useCallback(async () => {
    try {
      const data = await getCautelas();
      setCautelas(data);
      const sel = cautelaSelecionadaRef.current;
      if (sel) {
        const atualizada = data.find((c) => c.id === sel.id);
        if (atualizada && atualizada.status !== sel.status)
          setCautelaSelecionada(atualizada);
      }
    } catch {
      setCautelas([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarCautelas();
    const interval = setInterval(() => void carregarCautelas(), 5000);
    return () => clearInterval(interval);
  }, [carregarCautelas]);

  useEffect(() => {
    function onSelecionar(e: Event) {
      const cautela = (e as CustomEvent<{ cautela: Cautela }>).detail.cautela;
      const origem = isCautelaAtivaPortaria(cautela) ? "ativas" : "historico";
      abrirDetalhe(cautela, origem);
    }
    window.addEventListener("cautela-selecionar", onSelecionar);
    return () => window.removeEventListener("cautela-selecionar", onSelecionar);
  }, []);

  useEffect(() => {
    function onSearch(e: Event) {
      const term = (e as CustomEvent<{ term: string }>).detail.term;
      setSearchTerm(term);
      setPaginaHistorico(1);
    }
    window.addEventListener("cautela-search", onSearch);
    return () => window.removeEventListener("cautela-search", onSearch);
  }, []);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(""), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  function abrirDetalhe(cautela: Cautela, origem: "ativas" | "historico") {
    setCautelaSelecionada(cautela);
    setOrigemDetalhe(origem);
    void markCautelaAsRead(cautela.id)
      .then((atualizada) => {
        setCautelas((prev) =>
          prev.map((c) => (c.id === atualizada.id ? atualizada : c)),
        );
      })
      .catch((error) => {
        console.error("Erro ao marcar cautela como lida.", error);
      });
    setMobileView("detalhe");
  }

  // ── Listas ──
  const cautelasAtivas = cautelas.filter(isCautelaAtivaPortaria);
  const cautelasHistorico = cautelas.filter(
    (c) =>
      STATUS_HISTORICO.includes(c.status as StatusCautela) &&
      !isCautelaAtivaPortaria(c),
  );
  const cautelasFiltradas = searchTerm.trim()
    ? cautelasAtivas.filter((c) => matchesSearch(c, searchTerm))
    : cautelasAtivas;
  const historicoFiltrado = searchTerm.trim()
    ? cautelasHistorico.filter((c) => matchesSearch(c, searchTerm))
    : cautelasHistorico;

  const totalPaginasHistorico = Math.max(
    1,
    Math.ceil(historicoFiltrado.length / ITENS_POR_PAGINA),
  );
  const itensPaginaHistorico = historicoFiltrado.slice(
    (paginaHistorico - 1) * ITENS_POR_PAGINA,
    paginaHistorico * ITENS_POR_PAGINA,
  );

  const totalNaoLidas = cautelasAtivas.filter((c) =>
    Boolean(c.badgePortaria),
  ).length;

  // ── Ações ──
  async function handleAprovarEntrada(id: string) {
    try {
      setActionError("");
      const aprovada = await validateEntry(id);
      setCautelas((prev) => prev.map((c) => (c.id === id ? aprovada : c)));
      setCautelaSelecionada(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar a entrada.",
      );
    }
  }

  async function handleAprovarSaida(id: string) {
    try {
      setActionError("");
      const encerrada = await closeCautela(id);
      setCautelas((prev) => prev.map((c) => (c.id === id ? encerrada : c)));
      setCautelaSelecionada(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível encerrar.",
      );
      return;
    }
    setModalEncerrada(true);
  }

  // ── Lista de cards ativos ──
  const listaCards = (
    <div className="py-2 px-3">
      {cautelasFiltradas.length === 0 && (
        <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
          {searchTerm
            ? `Nenhum resultado para "${searchTerm}".`
            : "Nenhuma cautela autorizada."}
        </p>
      )}
      {cautelasFiltradas.map((cautela) => (
        <CardCautelaPortaria
          key={cautela.id}
          cautela={cautela}
          isNaoLida={Boolean(cautela.badgePortaria)}
          isSelected={cautelaSelecionada?.id === cautela.id}
          onClick={() => abrirDetalhe(cautela, "ativas")}
          onAprovarEntrada={
            cautela.etapaFluxo === "APROVADA_PELO_GESTOR"
              ? (id) => void handleAprovarEntrada(id)
              : undefined
          }
          onAprovarSaida={
            cautela.status === "Saída Autorizada"
              ? (id) => void handleAprovarSaida(id)
              : undefined
          }
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen pt-[60px] pl-[70px] lg:pl-[70px] bg-[#F5F7F6] relative overflow-x-hidden lg:overflow-hidden">
      <CautelaPrint cautela={cautelaSelecionada} />
      {actionError && (
        <div className="fixed left-[90px] right-5 top-[76px] z-40 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* ══ DESKTOP ══ */}
      <div className="hidden lg:flex h-[calc(100vh-60px)]">
        {/* Coluna esquerda — Cautelas autorizadas */}
        <div
          className={`w-[550px] flex-shrink-0 px-6 pt-6 pb-4 flex flex-col h-full relative ${
            cautelaSelecionada && origemDetalhe === "ativas" ? "z-10" : "z-0"
          }`}
        >
          <div
            className="flex flex-col h-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <div className="bg-[#22592A] px-5 py-4 flex-shrink-0 rounded-t-xl flex items-center justify-between">
              <h2 className="text-white font-bold text-base">
                Cautelas autorizadas
              </h2>
              {totalNaoLidas > 0 && (
                <div className="min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-white text-[13px] font-bold bg-[#0E9F6E]">
                  {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-[#E5E7EB]">
              {listaCards}
            </div>
          </div>
        </div>

        {/* Área central */}
        <div className="flex-1 relative flex flex-col items-center py-8 px-6">
          {cautelaSelecionada && (
            <>
              <div
                className="fixed inset-0 z-[5]"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                onClick={() => setCautelaSelecionada(null)}
              />
              <div
                className="fixed top-21 w-[540px] z-20 overflow-y-auto"
                style={{
                  left: origemDetalhe === "ativas" ? "620px" : "50%",
                  transform:
                    origemDetalhe === "historico"
                      ? "translateX(-50%)"
                      : undefined,
                  right: undefined,
                  maxHeight: "calc(100vh - 100px)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <DetalhesCautela
                  cautela={cautelaSelecionada}
                  onFechar={() => setCautelaSelecionada(null)}
                  variant="historico"
                  mostrarAcompanhamento
                  acoes={
                    <>
                      {cautelaSelecionada.etapaFluxo ===
                        "APROVADA_PELO_GESTOR" && (
                        <button
                          onClick={() =>
                            void handleAprovarEntrada(cautelaSelecionada.id)
                          }
                          className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
                        >
                          Aprovar entrada
                        </button>
                      )}
                      {cautelaSelecionada.status === "Saída Autorizada" && (
                        <button
                          onClick={() =>
                            void handleAprovarSaida(cautelaSelecionada.id)
                          }
                          className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
                        >
                          Aprovar saída
                        </button>
                      )}
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Imprimir
                      </button>
                    </>
                  }
                />
              </div>
            </>
          )}

          {/* Barra de pesquisa */}
          <div className="flex items-center gap-3 mb-8 mt-10 w-full max-w-[780px]">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPaginaHistorico(1);
                }}
                placeholder="Pesquise por nome, do solicitante, Id de cautela ou status"
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setPaginaHistorico(1)}
              className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap"
            >
              Pesquisar
            </button>
          </div>

          {/* Tabela */}
          <div className="w-full max-w-[1200px] bg-white rounded-lg border border-[#E5E7EB] shadow-sm relative z-0 overflow-x-auto">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.25fr_1.35fr] bg-[#2B8E37] text-white text-[15px] font-bold px-4 py-1.5 min-w-[800px]">
              <span>Solicitante</span>
              <span>Data</span>
              <span>Hora</span>
              <span>Id da cautela</span>
              <span className="flex justify-center">Status</span>
              <span className="flex justify-center">Tipo</span>
              <span className="flex justify-center">Aprovador</span>
            </div>

            {/* Linhas */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 320px)" }}
            >
              {historicoFiltrado.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm">
                  {searchTerm
                    ? `Nenhum resultado para "${searchTerm}".`
                    : "Nenhum histórico."}
                </div>
              ) : (
                itensPaginaHistorico.map((cautela, i) => {
                  const { data, hora } = formatarData(cautela.data);
                  const selecionada = cautelaSelecionada?.id === cautela.id;
                  return (
                    <div
                      key={cautela.id}
                      onClick={() => abrirDetalhe(cautela, "historico")}
                      className={`grid grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.25fr_1.35fr] px-4 py-3 text-[14px] min-w-[800px] text-[#111827] items-center cursor-pointer transition-colors border-b border-[#F3F4F6] last:border-0 ${
                        selecionada
                          ? "bg-[#E8F5EA] border-l-4 border-l-[#2B8E37]"
                          : i % 2 === 1
                            ? "bg-[#F9FAFB] hover:bg-[#F0FDF4]"
                            : "bg-white hover:bg-[#F0FDF4]"
                      }`}
                    >
                      <span className="truncate">
                        {cautela.visitante || "—"}
                      </span>
                      <span className="text-[#0A0A0A]">{data}</span>
                      <span className="text-[#0A0A0A]">{hora}</span>
                      <span className="text-[18px] text-[#0A0A0A]">
                        {cautela.id}
                      </span>
                      <span className="flex justify-center">
                        <BadgeTabela status={cautela.status as StatusCautela} />
                      </span>
                      <span className="flex justify-center truncate">
                        {cautela.status === "Reprovado"
                          ? "-"
                          : cautela.livreAcesso === "livre"
                            ? "Livre trânsito"
                            : "Entrada única"}
                      </span>
                      <span className="flex justify-center truncate">
                        {cautela.gestor || "—"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginação dentro da tabela */}
            {historicoFiltrado.length > ITENS_POR_PAGINA && (
              <div className="flex items-center justify-center gap-1 py-3 border-t border-[#E5E7EB]">
                <button
                  onClick={() => setPaginaHistorico((p) => Math.max(1, p - 1))}
                  disabled={paginaHistorico === 1}
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {paginasVisiveis(paginaHistorico, totalPaginasHistorico).map(
                  (p, i) =>
                    p === "..." ? (
                      <span
                        key={`e-${i}`}
                        className="px-2 py-1.5 text-[13px] text-[#9CA3AF]"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPaginaHistorico(p as number)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                          paginaHistorico === p
                            ? "bg-[#2B8E37] text-white"
                            : "text-[#6B7280] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                )}
                <button
                  onClick={() =>
                    setPaginaHistorico((p) =>
                      Math.min(totalPaginasHistorico, p + 1),
                    )
                  }
                  disabled={paginaHistorico === totalPaginasHistorico}
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MOBILE ══ */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-60px)] pt-[40px] overflow-hidden">
        {mobileView === "lista" && (
          <div className="flex-1 overflow-y-auto">
            {/* Ativas */}
            <div className="mx-3 mt-3">
              <div className="bg-[#22592A] rounded-t-lg px-4 py-3 flex items-center justify-between">
                <h2 className="text-white font-bold text-base">
                  Cautelas autorizadas
                </h2>
                {totalNaoLidas > 0 && (
                  <div className="min-w-[24px] h-[24px] px-1 rounded-full flex items-center justify-center text-white text-[12px] font-bold bg-[#0E9F6E]">
                    {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
                  </div>
                )}
              </div>
              <div className="bg-[#E5E7EB] rounded-b-lg border border-gray-200">
                {listaCards}
              </div>
            </div>

            {/* Histórico mobile — cards simples */}
            <div className="mx-3 mt-4 mb-4">
              <div className="bg-[#22592A] rounded-t-lg px-4 py-3">
                <h2 className="text-white font-bold text-base">Histórico</h2>
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
                {historicoFiltrado.length === 0 && (
                  <p className="text-[13px] text-[#6B7280] text-center py-6">
                    Nenhum histórico.
                  </p>
                )}
                {historicoFiltrado
                  .slice(0, ITENS_POR_PAGINA)
                  .map((cautela, i) => {
                    const { data, hora } = formatarData(
                      ultimaAcaoData(cautela),
                    );
                    return (
                      <div
                        key={cautela.id}
                        onClick={() => abrirDetalhe(cautela, "historico")}
                        className={`px-4 py-3 cursor-pointer border-b border-[#F3F4F6] last:border-0 ${
                          i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-[#111827] truncate">
                            {cautela.visitante || "—"}
                          </span>
                          <BadgeTabela
                            status={cautela.status as StatusCautela}
                          />
                        </div>
                        <div className="flex gap-3 text-[12px] text-[#6B7280]">
                          <span>
                            {data} {hora}
                          </span>
                          <span className="truncate font-mono">
                            {cautela.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {mobileView === "detalhe" && cautelaSelecionada && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative flex items-center justify-center px-4 py-3 mt-2 flex-shrink-0">
              <button
                onClick={() => {
                  setMobileView("lista");
                  setCautelaSelecionada(null);
                }}
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
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="bg-white rounded-sm border border-black p-6">
                <DetalhesCautelaPortaria
                  cautela={cautelaSelecionada}
                  onFechar={() => {
                    setMobileView("lista");
                    setCautelaSelecionada(null);
                  }}
                  onAprovarEntrada={
                    cautelaSelecionada.etapaFluxo === "APROVADA_PELO_GESTOR"
                      ? () => void handleAprovarEntrada(cautelaSelecionada.id)
                      : undefined
                  }
                  onAprovarSaida={
                    cautelaSelecionada.status === "Saída Autorizada"
                      ? () => void handleAprovarSaida(cautelaSelecionada.id)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {modalEncerrada && (
        <ModalEncerrada onClose={() => setModalEncerrada(false)} />
      )}
    </div>
  );
}
