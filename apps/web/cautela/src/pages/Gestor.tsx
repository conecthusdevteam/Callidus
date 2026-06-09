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

function BadgeHistorico({
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
  const ITENS_POR_PAGINA = 6;
  const [livreAcesso, setLivreAcesso] = useState<"livre" | "entrada">(
    "entrada",
  );
  const [cautelaEdicao, setCautelaEdicao] = useState<CautelaComDecisao | null>(
    null,
  );
  const [modalConfirmarAcesso, setModalConfirmarAcesso] = useState(false);
  const [modalAcessoSucesso, setModalAcessoSucesso] = useState(false);
  const [abaAtivaMobile, setAbaAtivaMobile] = useState<
    "solicitadas" | "emSaida"
  >("solicitadas");

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
          <>
            <div className="relative mx-3 mt-20 h-[56px] flex-shrink-0">
              <button
                onClick={() => setAbaAtivaMobile("emSaida")}
                className={`w-full h-[56px] text-[16px] rounded-t-lg transition-all relative ${
                  abaAtivaMobile === "emSaida"
                    ? "bg-[#22592A] text-white font-bold"
                    : "bg-[#C4EEC9] text-[#2B8E37]"
                }`}
              >
                <div
                  className="w-full h-full flex items-center justify-center gap-2"
                  style={{ paddingLeft: "50%" }}
                >
                  <span
                    style={{
                      fontWeight: abaAtivaMobile === "emSaida" ? 600 : 400,
                    }}
                  >
                    Em saída
                  </span>
                  <div className="relative">
                    <div className="min-w-[26px] h-[26px] px-1 rounded-full bg-[#0E9F6E] flex items-center justify-center text-white text-[13px] font-bold">
                      {historico.filter((c) => c.status === "Saída Autorizada")
                        .length > 9
                        ? "9+"
                        : historico.filter(
                            (c) => c.status === "Saída Autorizada",
                          ).length}
                    </div>
                    {historico.some((c) => c.status === "Saída Autorizada") && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                    )}
                  </div>
                </div>
              </button>

              {/* Aba Solicitadas */}
              <button
                onClick={() => setAbaAtivaMobile("solicitadas")}
                className={`absolute top-0 left-0 w-[50%] h-[56px] text-[16px] rounded-t-lg transition-all flex items-center justify-center gap-2 ${
                  abaAtivaMobile === "solicitadas"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
              >
                <span
                  style={{
                    fontWeight: abaAtivaMobile === "solicitadas" ? 600 : 400,
                  }}
                >
                  Solicitadas
                </span>

                <div className="relative">
                  <div className="min-w-[26px] h-[26px] px-1 gap-4 rounded-full bg-[#0E9F6E] flex items-center justify-center text-white text-[13px] font-bold">
                    {recebidas.length > 9 ? "9+" : recebidas.length}
                  </div>

                  {mostrarBolinhaGestor && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                  )}
                </div>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-3 bg-[#E5E7EB] rounded-b-lg border border-[#E5E7EB]">
                {abaAtivaMobile === "solicitadas" && (
                  <div className="py-2 px-3">
                    {recebidas.length === 0 ? (
                      <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
                        Nenhuma cautela pendente.
                      </p>
                    ) : (
                      recebidas.map((c, i) => (
                        <CardCautelaRecebida
                          key={c.id}
                          cautela={c}
                          index={i}
                          isNaoLida={
                            c.badgeGestor === "NOVA_CAUTELA_SOLICITADA"
                          }
                          isMobile={true}
                          livreAcesso={livreAcesso}
                          onLivreAcessoChange={setLivreAcesso}
                          onClick={() => {
                            abrirDetalhe(c, "recebidas");
                            setMobileView("detalhe");
                          }}
                          onAprovar={aprovar}
                          onDescartar={abrirDescartar}
                        />
                      ))
                    )}
                  </div>
                )}

                {abaAtivaMobile === "emSaida" && (
                  <div className="py-2 px-3">
                    {historico.length === 0 ? (
                      <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
                        Nenhuma cautela.
                      </p>
                    ) : (
                      historico.map((c, i) => {
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
                            className={`px-4 py-3 cursor-pointer border-b border-[#F3F4F6] last:border-0 rounded-sm mb-1 ${
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
                      })
                    )}
                  </div>
                )}
              </div>
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
              className="fixed top-20 w-[540px] z-50 overflow-y-auto"
              style={{ left: "500px", maxHeight: "calc(100vh - 100px)" }}
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
          <div className="flex items-center gap-3 mb-[39px] mt-[120px] w-full max-w-[607px]">
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
          <div className="w-full max-w-[1126px] bg-white rounded-lg border border-[#E5E7EB] shadow-sm relative z-0 overflow-x-auto ml-[-15px]">
            <div className="grid grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.35fr_52px] bg-[#2B8E37] text-white text-[15px] font-bold px-4 py-2 min-w-[800px]">
              <span>Solicitante</span>
              <span>Data</span>
              <span>Hora</span>
              <span className="flex justify-center">Id da cautela</span>
              <span className="flex justify-center">Status</span>
              <span className="flex justify-center">Tipo</span>
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
                  const { data, hora } = formatarData(ultimaAcaoData(cautela));
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
                        <BadgeHistorico
                          status={statusHistorico(cautela)}
                          etapaFluxo={cautela.etapaFluxo}
                        />
                      </span>
                      <span className="flex justify-center">
                        {cautela.status === "Reprovado" ||
                        cautela.status === "Encerrada" ||
                        cautela.etapaFluxo === "APROVADA_PELO_GESTOR" ? (
                          <span className="text-[14px] text-[#6B7280]">
                            {cautela.status === "Reprovado"
                              ? "Sem acesso"
                              : cautela.livreAcesso === "livre"
                                ? "Livre trânsito"
                                : "Entrada única"}
                          </span>
                        ) : (
                          <select
                            value={cautela.livreAcesso ?? "entrada"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCautelaEdicao(cautela);
                              setLivreAcesso(
                                e.target.value as "livre" | "entrada",
                              );
                              setModalConfirmarAcesso(true);
                            }}
                            className="text-[13px] border border-[#D1D5DB] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2B8E37] cursor-pointer"
                          >
                            <option value="entrada">Entrada única</option>
                            <option value="livre">Livre trânsito</option>
                          </select>
                        )}
                      </span>
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
      {modalConfirmarAcesso && cautelaEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-amber-100">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <p className="text-base font-bold text-black text-center">
              Deseja alterar o tipo de acesso?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setModalConfirmarAcesso(false);
                  setCautelaEdicao(null);
                  void carregarCautelas(); // reseta o select
                }}
                className="px-6 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-200"
              >
                Não
              </button>
              <button
                onClick={async () => {
                  setModalConfirmarAcesso(false);
                  const atualizada = await updatePermissionType(
                    cautelaEdicao.id,
                    livreAcesso === "livre"
                      ? "LIVRE_TRANSITO"
                      : "ENTRADA_UNICA",
                  );
                  setCautelas((prev) =>
                    prev.map((c) =>
                      c.id === cautelaEdicao.id ? atualizada : c,
                    ),
                  );
                  setCautelaEdicao(null);
                  setModalAcessoSucesso(true);
                }}
                className="px-6 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#22592A]"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAcessoSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 min-w-[320px]">
            <button
              onClick={() => setModalAcessoSucesso(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#D1FAE5]">
              <svg
                className="w-6 h-6 text-[#0E9F6E]"
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
            <p className="text-base font-bold text-black text-center">
              Alteração de acesso realizada com sucesso!
            </p>
          </div>
        </div>
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
