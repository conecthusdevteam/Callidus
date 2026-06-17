import { useCallback, useEffect, useState } from "react";
import { CardCautelaRecebida } from "../components/CardCautelaRecebida";
import { type Cautela, type StatusCautela } from "../data/cautelaTypes";
import {
  approveCautela,
  authorizeDeparture,
  getCautelas,
  markCautelaAsRead,
  rejectCautela,
  updatePermissionType,
} from "../lib/api";
import DetalhesCautela from "../components/DetalhesCautela";
import { DetalhesConteudo } from "../components/DetalhesConteudo";
import {
  ModalAprovado,
  ModalAutorizarSaida,
  ModalDescartar,
  ModalRecusado,
} from "../components/ModalGestor";
import { matchesSearch } from "../lib/cautelaUtils";
import { Tabela, type CautelaComDecisao } from "../components/Tabela";
import { ModalConfirmarAcesso, ModalAcessoSucesso } from "../components/Modais";
import { MenuInferior } from "../components/MenuInferior";
import { MenuHistorico } from "../components/MenuHistorico";
import { MenuLista } from "../components/MenuLista";

type Tab = "recebidas" | "historico";
type MobileView =
  | "lista"
  | "detalhe"
  | "historico"
  | "confirmacao-aprovado"
  | "confirmacao-recusado";

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
        className="min-w-[30px] h-[30px] px-1.5 mx-6 rounded-full flex items-center justify-center text-white text-[18px] font-bold"
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
  const ITENS_POR_PAGINA = 6;
  const [livreAcesso, setLivreAcesso] = useState<"livre" | "entrada">(
    "entrada",
  );
  const [cautelaEdicao, setCautelaEdicao] = useState<CautelaComDecisao | null>(
    null,
  );
  const [modalConfirmarAcesso, setModalConfirmarAcesso] = useState(false);
  const [modalAcessoSucesso, setModalAcessoSucesso] = useState(false);
  const recebidas = cautelas.filter((c) => {
    const ok = c.status === "Em análise" && !c.decisaoLocal;
    return searchTerm.trim() ? ok && matchesSearch(c, searchTerm) : ok;
  });
  const temSolicitadas = recebidas.length > 0;
  const temEmSaida = cautelas.some((c) => c.status === "Saída Autorizada");
  const [abaAtivaMobileManual, setAbaAtivaMobile] = useState<
    "solicitadas" | "emSaida" | null
  >(null);

  const abaAtivaMobile =
    abaAtivaMobileManual ??
    (!temSolicitadas && temEmSaida ? "emSaida" : "solicitadas");

  const [menuAtivo, setMenuAtivo] = useState<
    "home" | "historico" | "configuracoes"
  >("home");

  const carregarCautelas = useCallback(async () => {
    try {
      const data = await getCautelas();
      setCautelas(data);
      setCautelaSelecionada((prev) => {
        if (!prev) return prev;
        const atualizada = data.find((c) => c.id === prev.id);
        return atualizada ?? prev;
      });
    } catch (error) {
      console.error("Erro ao carregar cautelas.", error);
      setCautelas([]);
    }
  }, []);

  const livreAcessoAtual =
    cautelaSelecionada?.tipoPermissao === "LIVRE_TRANSITO"
      ? "livre"
      : livreAcesso;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarCautelas();
    const interval = setInterval(() => void carregarCautelas(), 20000);
    return () => clearInterval(interval);
  }, [carregarCautelas]);

  const historico = cautelas.filter((c) => {
    const ok =
      !!c.decisaoLocal ||
      c.status === "Em validação" ||
      c.status === "Aprovado" ||
      c.status === "Reprovado" ||
      c.status === "Saída Autorizada" ||
      c.status === "Encerrada";
    return searchTerm.trim() ? ok && matchesSearch(c, searchTerm) : ok;
  });

  const totalPaginasGestor = Math.max(
    1,
    Math.ceil(historico.length / ITENS_POR_PAGINA),
  );
  const itensPaginaGestor = historico.slice(
    (paginaHistorico - 1) * ITENS_POR_PAGINA,
    paginaHistorico * ITENS_POR_PAGINA,
  );

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
  }, [cautelas]);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(""), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  useEffect(() => {
    if (!modalAcessoSucesso) return;
    const t = setTimeout(() => setModalAcessoSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [modalAcessoSucesso]);

  const isSomenteLeitura = (c: CautelaComDecisao) =>
    c.decisaoLocal !== undefined ||
    c.status === "Em validação" ||
    (c.status === "Aprovado" && c.etapaFluxo === "APROVADA_PELO_GESTOR") ||
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
        livreAcessoAtual === "livre" ? "LIVRE_TRANSITO" : "ENTRADA_UNICA", // ← corrigido
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
    setCautelaSelecionada(null);
    setMobileView("lista");
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
    if (c.decisaoLocal === "reprovado") return "Reprovado";
    if (c.decisaoLocal === "aprovado" && c.status !== "Em validação")
      return "Aprovado";
    return c.status as StatusCautela;
  }

  return (
    <>
      {/* ══ MOBILE ══ */}
      <div className="lg:hidden flex flex-col h-dvh overflow-hidden bg-[#F5F7F6]">
        {actionError && (
          <div className="fixed top-[72px] left-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {mobileView === "lista" && (
          <MenuLista
            cautelas={cautelas}
            recebidas={recebidas}
            historico={historico}
            abaAtivaMobile={abaAtivaMobile}
            onAbaChange={setAbaAtivaMobile}
            livreAcesso={livreAcesso}
            onLivreAcessoChange={setLivreAcesso}
            onClickCard={(c, origem) => {
              abrirDetalhe(c, origem);
              setMobileView("detalhe");
            }}
            onClickHistorico={(c) => {
              abrirDetalhe(c, "historico");
              setMobileView("detalhe");
            }}
            onAprovar={aprovar}
            onDescartar={abrirDescartar}
            statusHistorico={statusHistorico}
            mostrarBolinhaGestor={mostrarBolinhaGestor}
            onTipoAcessoChange={(c, valor) => {
              setCautelaEdicao(c);
              setLivreAcesso(valor);
              setModalConfirmarAcesso(true);
            }}
          />
        )}

        {mobileView === "detalhe" && cautelaSelecionada && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="relative flex items-center px-4 py-3 mt-16">
              <button
                onClick={() => {
                  if (
                    origemDetalhe === "historico" &&
                    menuAtivo === "historico"
                  ) {
                    setMobileView("historico");
                  } else {
                    setMobileView("lista");
                    setMenuAtivo("home");
                  }
                }}
                className="text-gray-600 mr-3"
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
              <span className="text-[14px] text-[#404040]">
                Home <span className="mx-1">›</span> Visualização de cautela
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 pb-28 flex flex-col gap-3">
              <DetalhesConteudo
                cautela={cautelaSelecionada}
                onAutorizarSaida={() =>
                  handleAutorizarSaida(cautelaSelecionada.id)
                }
                livreAcesso={livreAcessoAtual} // ← corrigido
                onLivreAcessoChange={setLivreAcesso}
                onAprovar={() => aprovar(cautelaSelecionada.id)}
                onDescartar={() => abrirDescartar(cautelaSelecionada.id)}
                onTipoAcessoChange={(valor) => {
                  setCautelaEdicao(cautelaSelecionada);
                  setLivreAcesso(valor);
                  setModalConfirmarAcesso(true);
                }}
              />
            </div>

            {!isSomenteLeitura(cautelaSelecionada) && (
              <div className="fixed bottom-[70px] left-0 right-0 flex flex-col gap-2 px-4 pb-3 pt-3 bg-white border-t border-gray-200">
                <button
                  onClick={() => aprovar(cautelaSelecionada.id)}
                  className="w-full py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold"
                >
                  Aprovar entrada
                </button>
                <button
                  onClick={() => abrirDescartar(cautelaSelecionada.id)}
                  className="w-full py-2 text-[#737373] bg-[#F5F5F5] text-sm font-medium rounded-lg"
                >
                  Reprovar
                </button>
              </div>
            )}
          </div>
        )}

        {mobileView === "historico" && (
          <MenuHistorico
            historico={historico}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onVoltar={() => {
              setMenuAtivo("home");
              setMobileView("lista");
            }}
            onClickLinha={(c) => {
              abrirDetalhe(c, "historico");
              setMobileView("detalhe");
            }}
            statusHistorico={statusHistorico}
          />
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

        <MenuInferior
          ativo={menuAtivo}
          onChange={(item) => {
            setMenuAtivo(item);
            if (item === "home") setMobileView("lista");
            if (item === "historico") setMobileView("historico");
          }}
        />
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden lg:flex h-screen pt-[60px] pl-[70px] bg-white overflow-hidden items-stretch">
        {actionError && (
          <div className="fixed left-[90px] right-5 top-[76px] z-40 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {/* Coluna esquerda — Recebidos */}
        <div className="w-[432px] h-[calc(100vh-60px)] pt-12 ml-[41px] flex-shrink-0 flex flex-col relative z-0">
          <div
            className="bg-[#22592A] px-5 py-4 flex-shrink-0 rounded-t-[5px] flex items-center justify-between"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-[18px]">Recebidos</h2>
            <ContadorRecebidas
              total={totalRecebidasNaoLidas}
              mostrarBolinha={mostrarBolinhaGestor}
            />
          </div>
          <div
            className="flex-1 overflow-y-auto bg-[#E5E7EB] flex flex-col gap-3 p-4 pb-8 rounded-b-[5px] border border-gray-200"
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
        <div className="flex-1 relative flex flex-col items-start pt-[144px] px-6 pb-4 z-20">
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
              <div className="fixed inset-0 z-50 flex items-center pt-10 justify-center pointer-events-none">
                <div
                  className="w-[420px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DetalhesCautela
                    cautela={cautelaSelecionada}
                    onFechar={() => setCautelaSelecionada(null)}
                    variant="historico"
                    ocultarBanner
                    acoes={
                      cautelaSelecionada.status === "Aprovado" &&
                      cautelaSelecionada.etapaFluxo !==
                        "APROVADA_PELO_GESTOR" ? (
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
              className="fixed top-20 w-[540px] z-50 overflow-y-auto"
              style={{ left: "550px", maxHeight: "calc(100vh - 100px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <DetalhesCautela
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
                variant="recebida"
                mostrarAcompanhamento
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
                            checked={livreAcessoAtual === "livre"}
                            onChange={() => setLivreAcesso("livre")}
                            className="w-4 h-4 accent-black"
                          />
                          Sim
                        </label>

                        <label className="flex items-center gap-6 text-[15px] text-black cursor-pointer">
                          <input
                            type="checkbox"
                            checked={livreAcessoAtual === "entrada"}
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

          {/* Barra de pesquisa + Tabela */}
          <Tabela
            variant="gestor"
            itens={itensPaginaGestor}
            totalItens={historico.length}
            cautelaSelecionadaId={cautelaSelecionada?.id}
            onClickLinha={(cautela: CautelaComDecisao) =>
              abrirDetalhe(cautela, "historico")
            }
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onPesquisar={() => {}}
            paginaAtual={paginaHistorico}
            totalPaginas={totalPaginasGestor}
            onPaginaAnterior={() =>
              setPaginaHistorico((p) => Math.max(1, p - 1))
            }
            onProximaPagina={() =>
              setPaginaHistorico((p) => Math.min(totalPaginasGestor, p + 1))
            }
            onIrParaPagina={setPaginaHistorico}
            itensPorPagina={ITENS_POR_PAGINA}
            onTipoAcessoChange={(
              cautela: CautelaComDecisao,
              valor: "livre" | "entrada",
            ) => {
              setCautelaEdicao(cautela);
              setLivreAcesso(valor);
              setModalConfirmarAcesso(true);
            }}
          />
        </div>
      </div>

      {/* Modais */}
      {modalConfirmarAcesso && cautelaEdicao && (
        <ModalConfirmarAcesso
          onCancelar={() => {
            setModalConfirmarAcesso(false);
            setLivreAcesso(cautelaEdicao.livreAcesso ?? "entrada");
            setCautelaEdicao(null);
          }}
          onConfirmar={async () => {
            setModalConfirmarAcesso(false);
            const atualizada = await updatePermissionType(
              cautelaEdicao.id,
              livreAcesso === "livre" ? "LIVRE_TRANSITO" : "ENTRADA_UNICA",
            );
            setCautelas((prev) =>
              prev.map((c) => (c.id === cautelaEdicao.id ? atualizada : c)),
            );
            setCautelaEdicao(null);
            setModalAcessoSucesso(true);
          }}
        />
      )}

      {modalAcessoSucesso && (
        <ModalAcessoSucesso onClose={() => setModalAcessoSucesso(false)} />
      )}

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
