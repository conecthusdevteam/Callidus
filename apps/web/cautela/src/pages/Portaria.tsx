import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import DetalhesCautela from "../components/DetalhesCautela";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import {
  closeCautela,
  getCautelas,
  markCautelaAsRead,
  validateEntry,
} from "../lib/api";
import { matchesSearch } from "../lib/cautelaUtils";
import { BadgeTabela } from "../components/BadgeTabelaPortaria";
import { CautelaPrint } from "../components/CautelaPrint";
import { CardCautelaPortaria } from "../components/CardCautelaPortaria";
import { DetalhesCautelaPortaria } from "../components/DetalhesCautelaPortaria";
import { Tabela } from "../components/Tabela";
import { ModalEncerrada, ModalAprovadoPortaria } from "../components/Modais";

const STATUS_HISTORICO: StatusCautela[] = [
  "Encerrada",
  "Reprovado",
  "Aprovado",
  "Saída Autorizada",
];
const ITENS_POR_PAGINA = 6;

type MobileView = "lista" | "detalhe";

function isCautelaAtivaPortaria(cautela: Cautela) {
  return (
    cautela.status === "Em análise" ||
    cautela.status === "Saída Autorizada" ||
    cautela.etapaFluxo === "APROVADA_PELO_GESTOR"
  );
}

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

export function BannerCard({ status }: { status: StatusCautela }) {
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
  if (status === "Em análise") {
    return (
      <div className="w-full text-center py-1 px-3 rounded mb-3 bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[12px] font-bold uppercase tracking-wide">
        Aguardando aprovação
      </div>
    );
  }
  return null;
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
  const [modalAprovado, setModalAprovado] = useState(false);
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
  const cautelasAtivas = cautelas
    .filter(isCautelaAtivaPortaria)
    .sort((a, b) => {
      const dateA = new Date(a.atualizadoEm ?? a.criadoEm ?? 0).getTime();
      const dateB = new Date(b.atualizadoEm ?? b.criadoEm ?? 0).getTime();
      return dateB - dateA;
    });
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
    setModalAprovado(true);
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
    setModalAprovado(true);
  }

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
          className={`w-[440px] flex-shrink-0 px-6 pt-6 pb-4 flex flex-col h-full relative ${
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
                  left: origemDetalhe === "ativas" ? "500px" : "50%",
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

          {/* Barra de pesquisa + Tabela*/}
          <Tabela
            variant="portaria"
            itens={itensPaginaHistorico}
            totalItens={historicoFiltrado.length}
            cautelaSelecionadaId={cautelaSelecionada?.id}
            onClickLinha={(cautela) => abrirDetalhe(cautela, "historico")}
            searchTerm={searchTerm}
            onSearchTermChange={(v) => {
              setSearchTerm(v);
              setPaginaHistorico(1);
            }}
            onPesquisar={() => setPaginaHistorico(1)}
            paginaAtual={paginaHistorico}
            totalPaginas={totalPaginasHistorico}
            onPaginaAnterior={() =>
              setPaginaHistorico((p) => Math.max(1, p - 1))
            }
            onProximaPagina={() =>
              setPaginaHistorico((p) => Math.min(totalPaginasHistorico, p + 1))
            }
            onIrParaPagina={setPaginaHistorico}
            itensPorPagina={ITENS_POR_PAGINA}
          />
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
      {modalAprovado && (
        <ModalAprovadoPortaria onClose={() => setModalAprovado(false)} />
      )}
    </div>
  );
}
