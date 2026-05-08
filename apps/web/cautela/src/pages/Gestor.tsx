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
    cautela.status === "Reprovado";

  return (
    <div>
      {isSomenteLeitura && (
        <div className="mb-4">
          <StatusBadge status={statusExibido as StatusCautela} fullWidth />
          {cautela.status === "Aprovado" && cautela.aprovadoEm && (
            <p className="text-xs text-center text-[#065F46] mt-1">
              em {cautela.aprovadoEm}
            </p>
          )}
          {cautela.status === "Reprovado" && cautela.reprovadoEm && (
            <p className="text-xs text-center text-[#9B1C1C] mt-1">
              em {cautela.reprovadoEm}
            </p>
          )}
          {(cautela.motivoNegativa || cautela.decisaoLocal === "reprovado") && (
            <div className="mt-3">
              <p className="text-sm text-black">
                <span className="font-semibold">Justificativa:</span>{" "}
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
      {(cautela.validade || cautela.aprovadoEm) && (
        <div className="mb-4">
          <p className="text-sm font-bold text-black">Válido até:</p>
          <p className="text-sm text-gray-700">
            {cautela.validade ?? cautela.aprovadoEm}
          </p>
        </div>
      )}
      {cautela.status === "Encerrada" && cautela.encerradaEm && (
        <div className="mb-4">
          <p className="text-base font-bold text-black">Data e hora de saída</p>
          <p className="text-base text-black">{cautela.encerradaEm}</p>
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
            className="w-full py-2.5 rounded-lg bg-[#F5F5F5] text-black text-sm font-semibold hover:bg-gray-300 transition-colors"
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
  onClick,
  onAprovar,
  onDescartar,
}: {
  cautela: CautelaComDecisao;
  index: number;
  onClick: () => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
}) {
  const isPrimeiro = index === 0;

  return (
    <div
      onClick={onClick}
      className={`rounded-sm p-5 border cursor-pointer transition-all ${
        isPrimeiro
          ? "border-2 border-yellow-300 bg-[#FFFBE1]"
          : "border-black bg-white"
      }`}
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
          <span className="font-bold">{cautela.gestor.toUpperCase()}</span>
        </span>
      </div>
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
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
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

  // Mobile
  const [mobileView, setMobileView] = useState<MobileView>("lista");

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

    const interval = setInterval(() => {
      void carregarCautelas();
    }, 20000);

    return () => clearInterval(interval);
  }, [carregarCautelas]);

  const recebidas = cautelas.filter(
    (c) => c.status === "Em análise" && !c.decisaoLocal,
  );
  const historico = cautelas.filter(
    (c) =>
      c.decisaoLocal ||
      c.status === "Aprovado" ||
      c.status === "Reprovado" ||
      c.status === "Encerrada",
  );

  const isSomenteLeitura = (c: CautelaComDecisao) =>
    c.decisaoLocal !== undefined ||
    c.status === "Aprovado" ||
    c.status === "Reprovado" ||
    c.status === "Encerrada";

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
      // Atualiza painel de detalhes aberto imediatamente
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
    // Mobile
    setMobileView("lista");
  }

  return (
    <>
      {/* ══════════════ MOBILE ══════════════ */}
      <div className="md:hidden flex flex-col h-screen pt-[60px] bg-white">
        {actionError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </div>
        )}
        {mobileView === "lista" && (
          <>
            {/* Abas */}
            <div className="relative top-6 mx-4">
              <button
                onClick={() => setActiveTab("historico")}
                className={`w-full h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all ${
                  activeTab === "historico"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#2B8E37]"
                }`}
                style={{ paddingLeft: "50%" }}
              >
                Histórico
              </button>
              <button
                onClick={() => setActiveTab("recebidas")}
                className={`absolute top-0 left-0 w-1/2 h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
                  activeTab === "recebidas"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
              >
                Recebidas
              </button>
            </div>

            {/* Conteúdo */}
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
                      onClick={() => {
                        setCautelaSelecionada(cautela);
                        setMobileView("detalhe");
                      }}
                      onAprovar={aprovar}
                      onDescartar={abrirDescartar}
                    />
                  ))}
                </div>
              )}

              {activeTab === "historico" && (
                <div className="bg-white mt-6 mx-4">
                  {historico.length === 0 && (
                    <p className="text-sm text-gray-400 text-center mt-10">
                      Nenhuma cautela.
                    </p>
                  )}
                  {historico.map((cautela, index) => {
                    const statusExibido =
                      cautela.decisaoLocal === "aprovado"
                        ? "Aprovado"
                        : cautela.decisaoLocal === "reprovado"
                          ? "Reprovado"
                          : cautela.status;
                    return (
                      <div key={cautela.id}>
                        <div
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setCautelaSelecionada(cautela);
                            setMobileView("detalhe");
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] text-[#404040]">
                              Id Cautela:{" "}
                              <span className="font-medium">{cautela.id}</span>
                            </span>
                            <span className="text-[13px] text-[#404040]">
                              Data: {cautela.data}
                            </span>
                          </div>
                          <div className="flex items-center mt-4 justify-between">
                            <span className="text-[13px] text-[#404040]">
                              Ciente:{" "}
                              <span className="font-bold">
                                {cautela.gestor.toUpperCase()}
                              </span>
                            </span>
                            <StatusBadge
                              status={statusExibido as StatusCautela}
                            />
                          </div>
                        </div>
                        {index < historico.length - 1 && (
                          <div className="w-full h-px bg-black" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile — tela de detalhe */}
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
              {/* Só o conteúdo tem borda */}
              <div className="bg-white rounded-sm border border-black p-6">
                <DetalhesConteudo
                  cautela={cautelaSelecionada}
                  onAutorizarSaida={() =>
                    handleAutorizarSaida(cautelaSelecionada.id)
                  }
                />
              </div>
              {/* Botões fora da borda */}
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

        {/* Mobile — confirmação aprovado */}
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
          {/* Header */}
          <div
            className="bg-[#22592A] px-5 py-4 flex-shrink-0 rounded-t-lg mx-4 mt-4"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-base">Recebidas</h2>
          </div>

          {/* Cards */}
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
                onClick={() => setCautelaSelecionada(cautela)}
                onAprovar={aprovar}
                onDescartar={abrirDescartar}
              />
            ))}
          </div>
        </div>

        {/* Área central — vazia ou com detalhes */}
        {cautelaSelecionada ? (
          <div className="flex-1 flex flex-col overflow-hidden pt-14 mb-4 px-2">
            {/* Só o conteúdo tem borda */}
            <div className="flex-1 overflow-y-auto bg-white border border-black rounded-sm p-6">
              <DetalhesConteudo
                cautela={cautelaSelecionada}
                onAutorizarSaida={() =>
                  handleAutorizarSaida(cautelaSelecionada.id)
                }
              />
            </div>
            {/* Botões fora da borda */}
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
          {/* Header */}
          <div
            className="bg-[#22592A] pl-5 py-4 flex-shrink-0 rounded-t-lg mx-4 mt-4"
            style={{ boxShadow: "-4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <h2 className="text-white font-bold text-base">Histórico</h2>
          </div>

          {/* Lista */}
          <div
            className="flex-1 overflow-y-auto mx-4 mb-4 bg-[#E5E7EB] rounded-b-lg border border-gray-200"
            style={{ boxShadow: "-4px 0 8px rgba(0,0,0,0.25)" }}
          >
            {historico.length === 0 && (
              <p className="text-sm  text-gray-400 text-center mt-8">
                Nenhum histórico.
              </p>
            )}
            {historico.map((cautela, index) => {
              const statusExibido =
                cautela.decisaoLocal === "aprovado"
                  ? "Aprovado"
                  : cautela.decisaoLocal === "reprovado"
                    ? "Reprovado"
                    : cautela.status;
              return (
                <div key={cautela.id}>
                  <div
                    className="px-4 py-3 bg-[#F3F4F6] hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setCautelaSelecionada(cautela)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-[#404040]">
                        Id Cautela:{" "}
                        <span className="font-medium">{cautela.id}</span>
                      </span>
                      <span className="text-[13px] text-[#404040]">
                        Data: {cautela.data}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#404040]">
                        Ciente:{" "}
                        <span className="font-bold">
                          {cautela.gestor.toUpperCase()}
                        </span>
                      </span>
                      <StatusBadge status={statusExibido as StatusCautela} />
                    </div>
                  </div>
                  {index < historico.length - 1 && (
                    <div className="w-full h-px bg-[#E5E7EB]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modais globais (desktop + mobile) ── */}
      {modalDescartar && (
        <ModalDescartar
          onConfirmar={confirmarDescartar}
          onCancelar={() => {
            setModalDescartar(false);
          }}
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
