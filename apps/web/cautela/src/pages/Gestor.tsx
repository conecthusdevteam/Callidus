import { useCallback, useEffect, useState } from "react";
import { type Cautela, type StatusCautela } from "../data/cautelaTypes";
import {
  approveCautela,
  getCautelas,
  rejectCautela,
  authorizeDeparture,
  updatePermissionType,
  markCautelaAsRead,
} from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import {
  BannerAguardandoSaida,
  JustificativaBox,
} from "../components/BannerStatus";
import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { TabelaCautelados } from "../components/TabelaCautelados";
//import { CardCautelaHistorico } from "../components/CardCautelaHistorico";
import { matchesSearch } from "../lib/cautelaUtils";
import {
  ModalAprovado,
  ModalRecusado,
  ModalDescartar,
  ModalAutorizarSaida,
} from "../components/ModalGestor";
import DetalhesCautela from "../components/DetalhesCautela";
import ModalEdicaoCautela from "../components/ModalEdicaoCautela";

type Tab = "recebidas" | "historico";
type MobileView =
  | "lista"
  | "detalhe"
  | "confirmacao-aprovado"
  | "confirmacao-recusado";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
  livreAcesso?: "livre" | "entrada";
}

// ─── Painel de detalhes ───────────────────────────────────────────────────────

function DetalhesConteudo({
  cautela,
  onAutorizarSaida,
}: {
  cautela: CautelaComDecisao;
  onAutorizarSaida?: () => void;
}) {
  const tipoPermissaoLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "Livre trânsito"
      : "Entrada única";
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
            <div className="mt-2">
              <BannerAguardandoSaida />
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
            <div className="mt-3">
              <JustificativaBox motivo={cautela.motivoNegativa ?? "—"} />
            </div>
          )}
          {cautela.tipoPermissaoAlteradoEm && (
            <p className="mt-2 text-center text-sm font-semibold text-[#404040]">
              {tipoPermissaoLabel}
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="text-base font-bold text-black">Id da cautela</p>
        <p className="text-base text-black">{cautela.id}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Setor</p>
        <p className="text-base text-black">{cautela.setorId || "-"}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">
          Data e hora da solicitação
        </p>
        <p className="text-base text-black">{cautela.data}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">Proprietário</p>
        <p className="text-base text-black">{cautela.visitante}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Documento</p>
        <p className="text-base text-gray-700">{cautela.documento || "-"}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Empresa</p>
        <p className="text-base text-gray-700">{cautela.empresa || "-"}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">E-mail do proprietário</p>
        <p className="text-base text-black">{cautela.proprietarioEmail}</p>
      </div>
      {cautela.validade && (
        <div className="mb-4">
          <p className="text-base font-bold text-black">Válido até:</p>
          <p className="text-base text-gray-700">{cautela.validade}</p>
        </div>
      )}
      {cautela.aprovadoEm && (
        <div className="mb-4">
          <p className="text-base font-bold text-black">Aprovado em:</p>
          <p className="text-base text-gray-700">{cautela.aprovadoEm}</p>
        </div>
      )}
      {cautela.status === "Encerrada" && cautela.encerradaEm && (
        <div className="mb-3">
          <p className="text-base font-bold text-black">
            Data e hora de saída:
          </p>
          <p className="text-base text-gray-700">{cautela.encerradaEm}</p>
        </div>
      )}

      <div className="mt-16 mb-2">
        <TabelaCautelados equipamentos={cautela.equipamentos} />
      </div>

      {cautela.status === "Aprovado" &&
        cautela.decisaoLocal === undefined &&
        onAutorizarSaida && (
          <button
            onClick={onAutorizarSaida}
            className="w-full mt-12 py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Autorizar saída
          </button>
        )}
    </div>
  );
}

// ─── Card de Recebidas ────────────────────────────────────────────────────────

function CardCautelaRecebida({
  cautela,
  onClick,
  onAprovar,
  onDescartar,
  isNaoLida,
}: {
  cautela: CautelaComDecisao;
  index: number;
  isNaoLida: boolean;
  onClick: () => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
}) {
  const isAtencao = cautela.status === "Saída Autorizada";
  const status = cautela.status as StatusCautela;

  return (
    <div className="flex justify-center">
      <div
        onClick={onClick}
        className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 w-full ${
          isAtencao
            ? "border border-red-300 bg-[#FFF5F5]"
            : isNaoLida
              ? "border-2 border-amber-300 bg-[#FFFBEB]"
              : "border border-amber-200 bg-white"
        }`}
      >
        <div className="flex justify-center mb-3">
          <span
            className={`w-full text-center px-3 py-1 rounded text-[12px] font-bold uppercase tracking-wide ${
              isAtencao
                ? "bg-red-100 border border-red-300 text-red-600"
                : "bg-[#FCE96A] border border-amber-300 text-[#111827]"
            }`}
          >
            {isAtencao
              ? "Atenção - Solicitação de saída"
              : "Nova cautela solicitada"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <AvatarStatus status={status} />
            <div>
              <p className="text-[18px] font-bold leading-tight text-[#404040] truncate">
                {cautela.visitante || "Nome do solicitante"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
            <BadgeStatus status={isAtencao ? "Aprovado" : "Em análise"} />
          </div>
        </div>

        <p className="text-[15px] text-[#404040] mt-1">
          Data: {cautela.data || "00/00/0000"}
        </p>
        <p className="text-[15px] text-[#404040] mt-0.5">
          Ciente:{" "}
          <span className="font-bold">
            {(cautela.gestor || "").toUpperCase()}
          </span>
        </p>

        <hr className="border-black my-3" />

        <p className="text-[14px] font-medium text-[#404040] mb-1">
          Cautelados:
        </p>
        <ul className="mb-3 space-y-0.5">
          {cautela.equipamentos.slice(0, 3).map((eq, i) => (
            <li
              key={i}
              className="text-[14px] text-[#404040] flex items-start gap-1"
            >
              <span>•</span>
              {eq.descricao} - {eq.quantidade ?? 1}
            </li>
          ))}
          {cautela.equipamentos.length > 3 && (
            <li className="text-[11px] text-[#9CA3AF]">
              +{cautela.equipamentos.length - 3} item(ns)
            </li>
          )}
        </ul>

        <div
          className="flex items-center justify-between gap-2 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {!isAtencao ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAprovar(cautela.id)}
                className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
              >
                Aprovar
              </button>
              <button
                onClick={() => onDescartar(cautela.id)}
                className="px-5 py-2 rounded-lg bg-[#FAFAFA] border border-gray-400 text-black text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Descartar
              </button>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-[13px] px-4 py-2 bg-gray-100 rounded-lg text-[#171717] font-medium hover:underline whitespace-nowrap"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

function ContadorRecebidas({
  total,
  mostrarBolinha,
}: {
  total: number;
  mostrarBolinha: boolean;
}) {
  if (total === 0) return null;
  return (
    <div className="relative flex-shrink-0">
      <div
        className="min-w-[35px] h-[35px] px-1.5 mx-6 rounded-full flex items-center justify-center text-white text-[18px] font-bold"
        style={{ backgroundColor: "#0E9F6E" }}
      >
        {total > 9 ? "9+" : total}
      </div>
      {mostrarBolinha && (
        <span className="absolute mx-6 -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
      )}
    </div>
  );
}

function BadgeHistorico({ status }: { status: StatusCautela }) {
  if (status === "Aprovado") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#31C48D] bg-[#F0FDF4] text-[#065F46]">
        <span className="w-2 h-2 rounded-full bg-[#0E9F6E]" />
        Aprovado
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
        Encerrado
      </span>
    );
  }
  return null;
}

function paginasVisiveis(paginaAtual: number, totalPaginas: number) {
  const paginas: Array<number | "..."> = [];

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    const deveExibir =
      pagina === 1 ||
      pagina === totalPaginas ||
      Math.abs(pagina - paginaAtual) <= 1;

    if (deveExibir) {
      paginas.push(pagina);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return paginas;
}

// ─── Gestor ───────────────────────────────────────────────────────────────────

export default function Gestor() {
  const [, setActiveTab] = useState<Tab>("recebidas");
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
  const [origemDetalhe, setOrigemDetalhe] = useState<"recebidas" | "historico">(
    "recebidas",
  );
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const ITENS_POR_PAGINA = 8;
  const [livreAcesso, setLivreAcesso] = useState<"livre" | "entrada">(
    "entrada",
  );
  const [cautelaEdicao, setCautelaEdicao] = useState<CautelaComDecisao | null>(
    null,
  );

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
    const ok = c.status === "Em análise" && !c.decisaoLocal;
    return searchTerm.trim() ? ok && matchesSearch(c, searchTerm) : ok;
  });

  const historico = cautelas.filter((c) => {
    const ok =
      !!c.decisaoLocal ||
      c.status === "Aprovado" ||
      c.status === "Reprovado" ||
      c.status === "Saída Autorizada" ||
      c.status === "Encerrada";
    return searchTerm.trim() ? ok && matchesSearch(c, searchTerm) : ok;
  });

  useEffect(() => {
    function onSelecionar(e: Event) {
      const cautela = (e as CustomEvent<{ cautela: Cautela }>).detail.cautela;
      const completa = cautelas.find((c) => c.id === cautela.id) ?? cautela;
      abrirDetalhe(
        completa as CautelaComDecisao,
        completa.status !== "Em análise" ? "historico" : "recebidas",
      );
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
        const found = cautelas.find((c) => matchesSearch(c, term));
        if (found)
          setActiveTab(
            found.status !== "Em análise" ? "historico" : "recebidas",
          );
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

  function abrirDetalhe(
    cautela: CautelaComDecisao,
    origem: "recebidas" | "historico",
  ) {
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
  }

  const totalRecebidasNaoLidas = recebidas.filter(
    (c) => c.badgeGestor === "NOVA_CAUTELA_SOLICITADA",
  ).length;
  const mostrarBolinhaGestor = totalRecebidasNaoLidas > 0;

  async function aprovar(id: string) {
    try {
      setActionError("");
      const atualizada = await approveCautela(
        id,
        livreAcesso === "livre" ? "LIVRE_TRANSITO" : "ENTRADA_UNICA",
      );
      setCautelas((prev) => prev.map((c) => (c.id === id ? atualizada : c)));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível aprovar.",
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
      const atualizada = await authorizeDeparture(id);
      setCautelas((prev) => prev.map((c) => (c.id === id ? atualizada : c)));
      setCautelaSelecionada((prev) => (prev?.id === id ? atualizada : prev));
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
        const atualizada = await rejectCautela(
          cautelaSelecionada.id,
          justificativa,
        );
        setCautelas((prev) =>
          prev.map((c) => (c.id === cautelaSelecionada.id ? atualizada : c)),
        );
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Não foi possível reprovar.",
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

  function statusHistorico(c: CautelaComDecisao): StatusCautela {
    if (c.decisaoLocal === "aprovado") return "Aprovado";
    if (c.decisaoLocal === "reprovado") return "Reprovado";
    if (c.status === "Saída Autorizada") return "Aprovado";
    return c.status as StatusCautela;
  }

  return (
    <>
      {/* ══ MOBILE ══ */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#F5F7F6]">
        {actionError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {mobileView === "lista" && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-3 mt-3">
              <div className="bg-[#22592A] rounded-t-lg px-4 py-3 flex items-center justify-between">
                <h2 className="text-white font-bold text-base">Recebidas</h2>
                <ContadorRecebidas
                  total={totalRecebidasNaoLidas}
                  mostrarBolinha={mostrarBolinhaGestor}
                />
              </div>
              <div className="bg-[#E5E7EB] rounded-b-lg border border-gray-200 px-3 py-2">
                {recebidas.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nenhuma cautela pendente.
                  </p>
                )}
                {recebidas.map((c, i) => (
                  <CardCautelaRecebida
                    key={c.id}
                    cautela={c}
                    index={i}
                    isNaoLida={c.badgeGestor === "NOVA_CAUTELA_SOLICITADA"}
                    onClick={() => {
                      abrirDetalhe(c, "recebidas");
                      setMobileView("detalhe");
                    }}
                    onAprovar={aprovar}
                    onDescartar={abrirDescartar}
                  />
                ))}
              </div>
            </div>

            <div className="mx-3 mt-4 mb-4">
              <div className="bg-[#22592A] rounded-t-lg px-4 py-3">
                <h2 className="text-white font-bold text-base">Histórico</h2>
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
                {historico.length === 0 && (
                  <p className="text-[13px] text-[#6B7280] text-center py-6">
                    Nenhuma cautela.
                  </p>
                )}
                {historico.map((c, i) => {
                  const partes = c.data?.split(", ") ?? [];
                  const data = partes[0] ?? "";
                  const hora = partes[1] ?? "--:--";
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        abrirDetalhe(c, "historico");
                        setMobileView("detalhe");
                      }}
                      className={`px-4 py-3 cursor-pointer border-b border-[#F3F4F6] last:border-0 ${
                        i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-[#111827] truncate">
                          {c.visitante || "—"}
                        </span>
                        <BadgeHistorico status={statusHistorico(c)} />
                      </div>
                      <div className="flex gap-3 text-[12px] text-[#6B7280]">
                        <span>
                          {data} {hora}
                        </span>
                        <span className="truncate font-mono">{c.id}</span>
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

      {/* ══ DESKTOP ══ */}
      <div className="hidden lg:flex h-screen pt-[60px] pl-[70px] bg-white overflow-hidden items-stretch">
        {actionError && (
          <div className="fixed left-[90px] right-5 top-[76px] z-40 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {/* Coluna esquerda — Recebidos */}
        <div className="w-[550px] flex-shrink-0 flex flex-col h-[calc(100vh-60px)] pt-6 pb-4 px-6 relative z-0">
          <div
            className="bg-[#22592A] px-5 py-4 flex-shrink-0 rounded-t-xl flex items-center justify-between"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-[18px]">Recebidos</h2>
            <ContadorRecebidas
              total={totalRecebidasNaoLidas}
              mostrarBolinha={mostrarBolinhaGestor}
            />
          </div>
          <div
            className="flex-1 h-0 overflow-y-auto bg-[#E5E7EB] flex flex-col gap-3 p-4 pb-8 rounded-b-xl border border-gray-200"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            {recebidas.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                Nenhuma cautela pendente.
              </p>
            )}
            {recebidas.map((c, i) => (
              <CardCautelaRecebida
                key={c.id}
                cautela={c}
                index={i}
                isNaoLida={c.badgeGestor === "NOVA_CAUTELA_SOLICITADA"}
                onClick={() => abrirDetalhe(c, "recebidas")}
                onAprovar={aprovar}
                onDescartar={abrirDescartar}
              />
            ))}
          </div>
        </div>

        {/* Área central — tabela de histórico */}
        <div className="flex-1 relative flex flex-col items-center pt-[24px] px-6 pb-4 z-20">
          {/* Overlay */}
          {cautelaSelecionada && (
            <div
              className="fixed inset-0 z-[5]"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={() => setCautelaSelecionada(null)}
            />
          )}

          {cautelaSelecionada && origemDetalhe === "historico" && (
            <>
              <div
                className="fixed inset-0 z-[5]"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                onClick={() => setCautelaSelecionada(null)}
              />
              <div className="fixed inset-0 z-50 flex items-center pt-15 justify-center pointer-events-none">
                <div
                  className="w-[420px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DetalhesCautela
                    cautela={cautelaSelecionada}
                    onFechar={() => setCautelaSelecionada(null)}
                    variant="historico"
                    acoes={
                      cautelaSelecionada.status === "Aprovado" ? (
                        <button
                          onClick={() =>
                            void handleAutorizarSaida(cautelaSelecionada.id)
                          }
                          className="w-full py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                        >
                          Liberar saída
                        </button>
                      ) : null
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Recebidas — painel ao lado da aba */}
          {cautelaSelecionada && origemDetalhe === "recebidas" && (
            <div
              className="fixed top-20 w-[420px] z-50 overflow-y-auto"
              style={{ left: "620px", maxHeight: "calc(100vh - 100px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <DetalhesCautela
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
                variant="recebida"
                acoes={
                  !isSomenteLeitura(cautelaSelecionada) ? (
                    <>
                      <div className="flex items-center gap-10 mb-2">
                        <p className="text-[15px] text-black">
                          Esta cautela tem livre acesso?
                        </p>

                        <label className="flex items-center gap-6 text-[15px] text-black cursor-pointer">
                          <input
                            type="checkbox"
                            checked={livreAcesso === "livre"}
                            onChange={() => setLivreAcesso("livre")}
                            className="w-4 h-4 accent-black"
                          />
                          Sim
                        </label>

                        <label className="flex items-center gap-6 text-[15px] text-black cursor-pointer">
                          <input
                            type="checkbox"
                            checked={livreAcesso === "entrada"}
                            onChange={() => setLivreAcesso("entrada")}
                            className="w-4 h-4 accent-black"
                          />
                          Não
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => aprovar(cautelaSelecionada.id)}
                          className="flex-1 py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A]"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => abrirDescartar(cautelaSelecionada.id)}
                          className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-medium hover:bg-gray-100"
                        >
                          Descartar
                        </button>
                      </div>
                    </>
                  ) : null
                }
              />
            </div>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquise por nome, do solicitante, Id de cautela ou status"
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap">
              Pesquisar
            </button>
          </div>

          {/* Tabela */}
          <div className="w-full max-w-[1200px] bg-white rounded-lg border border-[#E5E7EB] shadow-sm relative z-0 overflow-x-auto">
            <div className="grid grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.35fr_52px] bg-[#2B8E37] text-white text-[15px] font-bold px-4 py-2 min-w-[800px]">
              <span>Solicitante</span>
              <span>Data</span>
              <span>Hora</span>
              <span className="flex justify-center">Id da cautela</span>
              <span className="flex justify-center">Status</span>
              <span className="flex justify-center">Acesso</span>
              <span>Editar</span>
            </div>

            {historico.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm">
                Nenhum histórico.
              </div>
            ) : (
              historico
                .slice(
                  (paginaHistorico - 1) * ITENS_POR_PAGINA,
                  paginaHistorico * ITENS_POR_PAGINA,
                )
                .map((cautela, i) => {
                  const partes = cautela.data?.split(", ") ?? [];
                  const data = partes[0] ?? "";
                  const hora = partes[1] ?? "--:--";
                  const selecionada = cautelaSelecionada?.id === cautela.id;
                  return (
                    <div
                      key={cautela.id}
                      onClick={() => abrirDetalhe(cautela, "historico")}
                      className={`grid grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.35fr_52px] px-4 py-3 text-[14px] text-[#0A0A0A] items-center border-b min-w-[800px] border-[#F3F4F6] last:border-0 transition-colors ${
                        selecionada
                          ? "bg-[#E8F5EA] border-l-4 border-l-[#2B8E37]"
                          : i % 2 === 1
                            ? "bg-[#F9FAFB]"
                            : "bg-white"
                      }`}
                    >
                      <span className="text-[18px] truncate">
                        {cautela.visitante || "—"}
                      </span>
                      <span className="text-[18px] text-[#0A0A0A]">{data}</span>
                      <span className="text-[18px] text-[#0A0A0A]">{hora}</span>
                      <span className="text-[18px] text-[#0A0A0A]">
                        {cautela.id}
                      </span>
                      <span className="flex justify-center">
                        <BadgeHistorico status={statusHistorico(cautela)} />
                      </span>
                      <span className="flex justify-center truncate text-[18px]">
                        {cautela.status === "Reprovado"
                          ? "-"
                          : (
                                cautela as CautelaComDecisao & {
                                  livreAcesso?: string;
                                }
                              ).livreAcesso === "livre"
                            ? "Livre trânsito"
                            : "Entrada única"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("abrindo edição", cautela.id);
                          setCautelaEdicao(cautela);
                          setLivreAcesso(cautela.livreAcesso ?? "entrada");
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex justify-center"
                        title="Editar"
                      >
                        <svg
                          width="18"
                          height="22"
                          viewBox="0 0 18 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M0 12.25V2.75C0 2.02065 0.289939 1.32139 0.805664 0.805664C1.32139 0.289939 2.02065 0 2.75 0H11.75C11.9489 0 12.1396 0.0790743 12.2803 0.219727L17.2803 5.21973C17.4209 5.36038 17.5 5.55109 17.5 5.75V18.75C17.5 19.4793 17.2101 20.1786 16.6943 20.6943C16.1786 21.2101 15.4793 21.5 14.75 21.5H9.25C8.83579 21.5 8.5 21.1642 8.5 20.75C8.5 20.3358 8.83579 20 9.25 20H14.75C15.0815 20 15.3994 19.8682 15.6338 19.6338C15.8682 19.3994 16 19.0815 16 18.75V6.06055L11.4395 1.5H2.75C2.41848 1.5 2.10063 1.63179 1.86621 1.86621C1.63179 2.10063 1.5 2.41848 1.5 2.75V12.25C1.5 12.6642 1.16421 13 0.75 13C0.335786 13 0 12.6642 0 12.25Z"
                            fill="#525252"
                          />
                          <path
                            d="M10 4.75V0.75C10 0.335786 10.3358 0 10.75 0C11.1642 0 11.5 0.335786 11.5 0.75V4.75C11.5 5.08152 11.6318 5.39937 11.8662 5.63379C12.1006 5.86821 12.4185 6 12.75 6H16.75C17.1642 6 17.5 6.33579 17.5 6.75C17.5 7.16421 17.1642 7.5 16.75 7.5H12.75C12.0207 7.5 11.3214 7.21006 10.8057 6.69434C10.2899 6.17861 10 5.47935 10 4.75Z"
                            fill="#525252"
                          />
                          <path
                            d="M10 12.8739C10 12.6936 9.96449 12.5151 9.89553 12.3485C9.82647 12.1818 9.72528 12.0298 9.59768 11.9022C9.47009 11.7746 9.31808 11.6734 9.15139 11.6043C8.9848 11.5354 8.8063 11.4999 8.626 11.4999C8.4457 11.4999 8.2672 11.5354 8.10061 11.6043C7.93392 11.6734 7.78191 11.7746 7.65432 11.9022L2.64455 16.9139C2.53308 17.0253 2.44328 17.1569 2.38088 17.3006L2.32815 17.4481L1.61819 19.8797L4.05081 19.1707L4.19827 19.118C4.34201 19.0556 4.47355 18.9658 4.58498 18.8543L9.59768 13.8456L9.6885 13.7459C9.774 13.6418 9.84373 13.5252 9.89553 13.4002C9.96459 13.2335 10 13.0543 10 12.8739ZM11.5 12.8739C11.5 13.2512 11.4256 13.6249 11.2813 13.9735C11.1729 14.2351 11.0266 14.479 10.8477 14.6971L10.6582 14.9061L5.64553 19.9159C5.31895 20.2425 4.91508 20.4816 4.4717 20.6112L1.60061 21.4481C1.3856 21.5107 1.15739 21.5144 0.940453 21.4588C0.7235 21.4032 0.525584 21.2901 0.367211 21.1317C0.208836 20.9733 0.0956886 20.7754 0.0400624 20.5584C-0.0155236 20.3415 -0.0118497 20.1133 0.0508046 19.8983L0.887719 17.0282C1.01727 16.5845 1.2571 16.1801 1.58401 15.8534L6.59377 10.8416C6.86065 10.5748 7.17771 10.363 7.52639 10.2186C7.87503 10.0742 8.24865 9.99985 8.626 9.99985C9.00335 9.99985 9.37697 10.0742 9.72561 10.2186C10.0743 10.363 10.3914 10.5748 10.6582 10.8416C10.9251 11.1085 11.1368 11.4256 11.2813 11.7743C11.4257 12.1229 11.5 12.4965 11.5 12.8739Z"
                            fill="#525252"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })
            )}

            {/* Paginação */}
            {historico.length > ITENS_POR_PAGINA && (
              <div className="flex items-center justify-center gap-1 py-3 border-t border-[#E5E7EB]">
                <button
                  onClick={() => setPaginaHistorico((p) => Math.max(1, p - 1))}
                  disabled={paginaHistorico === 1}
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {paginasVisiveis(
                  paginaHistorico,
                  Math.ceil(historico.length / ITENS_POR_PAGINA),
                ).map((p, index) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-[13px] text-[#9CA3AF]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPaginaHistorico(p)}
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
                      Math.min(
                        Math.ceil(historico.length / ITENS_POR_PAGINA),
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    paginaHistorico ===
                    Math.ceil(historico.length / ITENS_POR_PAGINA)
                  }
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
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
      {cautelaEdicao && (
        <ModalEdicaoCautela
          cautela={cautelaEdicao}
          livreAcesso={livreAcesso}
          onChangeLivreAcesso={setLivreAcesso}
          onSalvar={async () => {
            const atualizada = await updatePermissionType(
              cautelaEdicao.id,
              livreAcesso === "livre" ? "LIVRE_TRANSITO" : "ENTRADA_UNICA",
            );
            setCautelas((prev) =>
              prev.map((c) => (c.id === cautelaEdicao.id ? atualizada : c)),
            );
          }}
          onFechar={() => setCautelaEdicao(null)}
        />
      )}
    </>
  );
}
