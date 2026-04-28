import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import {
  mockCautelas,
  type Cautela,
  type StatusCautela,
} from "../data/mockData";

type Tab = "recebidas" | "historico";
type MobileView =
  | "lista"
  | "detalhe"
  | "confirmacao-aprovado"
  | "confirmacao-recusado";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
}

// ── Modal de aprovação ──
function ModalAprovado({ onClose }: { onClose: () => void }) {
  setTimeout(onClose, 3000);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-16 py-10 flex flex-col items-center gap-4 min-w-[340px]">
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
    </div>
  );
}

// ── Modal de recusado ──
function ModalRecusado({ onClose }: { onClose: () => void }) {
  setTimeout(onClose, 3000);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-16 py-10 flex flex-col items-center gap-4 min-w-[340px]">
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
          A cautela foi recusada com sucesso
        </p>
      </div>
    </div>
  );
}

// ── Modal de descartar ──
function ModalDescartar({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: (justificativa: string) => void;
  onCancelar: () => void;
}) {
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px] flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 6V4h6v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v6M14 11v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-black text-center">
          Tem certeza que deseja
          <br />
          recusar a cautela?
        </h2>

        <div className="w-full">
          <label className="text-sm text-gray-600 mb-1 block">
            Justificativa:
          </label>
          <textarea
            rows={4}
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value);
              if (e.target.value.trim()) setErro(false);
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none resize-none ${
              erro ? "border-red-400 border-2" : "border-gray-300"
            }`}
          />
          {erro && (
            <p className="text-red-500 text-xs mt-1">
              A justificativa é obrigatória.
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              if (!justificativa.trim()) {
                setErro(true);
                return;
              }
              onConfirmar(justificativa.trim());
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#2B8E37] text-white font-semibold text-sm hover:bg-[#22592A] transition-colors"
          >
            Enviar
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-black font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Painel de detalhes da cautela ──
function DetalhesCautela({
  cautela,
  onAprovar,
  onDescartar,
  somenteLeitura = false,
}: {
  cautela: CautelaComDecisao;
  onAprovar: () => void;
  onDescartar: () => void;
  somenteLeitura?: boolean;
}) {
  const statusExibido =
    cautela.decisaoLocal === "aprovado"
      ? "Aprovado"
      : cautela.decisaoLocal === "reprovado"
        ? "Reprovado"
        : cautela.status;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Status no topo — só no histórico */}
        {somenteLeitura && (
          <div className="mb-4">
            <StatusBadge status={statusExibido as StatusCautela} fullWidth />
            {(cautela.motivoNegativa ||
              cautela.decisaoLocal === "reprovado") && (
              <div className="mt-3">
                <p className="text-sm text-gray-700">
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
          <p className="text-base font-bold text-black">
            Data e hora de entrada
          </p>
          <p className="text-base text-black">{cautela.data}</p>
        </div>
        <div className="mb-4">
          <p className="text-base font-bold text-black">Propriedade</p>
          <p className="text-base text-black">{cautela.visitante}</p>
        </div>
        <div className="mb-4">
          <p className="text-base font-bold text-black">
            E-mail do proprietário
          </p>
          <p className="text-base text-black">
            {cautela.visitante.toLowerCase().replace(" ", ".")}@callidus.org.br
          </p>
        </div>
        {cautela.aprovadoEm && (
          <div className="mb-4">
            <p className="text-sm font-bold text-black">Válido até:</p>
            <p className="text-sm text-gray-700">{cautela.aprovadoEm}</p>
          </div>
        )}

        <table className="w-full mt-2 overflow-hidden">
          <thead>
            <tr style={{ backgroundColor: "#0E9F6E" }}>
              <th className="px-4 py-2 text-left text-white text-base font-bold">
                Descrição
              </th>
              <th className="px-4 py-2 text-left text-white text-base font-bold">
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            {cautela.equipamentos.map((eq, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 even:bg-[#F4F4F4]"
              >
                <td className="px-4 py-3 text-sm text-[#0A0A0A]">
                  {eq.descricao}
                </td>
                <td className="px-4 py-3 text-sm text-[#0A0A0A]">
                  {eq.quantidade ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botões — só quando não é somente leitura */}
      {!somenteLeitura && (
        <div className="flex gap-3 px-8 pb-8 pt-4 justify-center">
          <button
            onClick={onAprovar}
            className="px-8 py-2.5 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
          >
            Aprovar
          </button>
          <button
            onClick={onDescartar}
            className="px-8 py-2.5 rounded-lg border border-gray-300 text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Descartar
          </button>
        </div>
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
          ? "border-2 border-red-400 bg-[#FCA5A54D]"
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
          className="px-5 py-2 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
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
  const [cautelas, setCautelas] = useState<CautelaComDecisao[]>(mockCautelas);
  const [cautelaSelecionada, setCautelaSelecionada] =
    useState<CautelaComDecisao | null>(null);
  const [modalDescartar, setModalDescartar] = useState(false);
  const [modalAprovado, setModalAprovado] = useState(false);
  const [modalRecusado, setModalRecusado] = useState(false);

  // Mobile
  const [mobileView, setMobileView] = useState<MobileView>("lista");

  const recebidas = cautelas.filter(
    (c) => c.status === "Em análise" && !c.decisaoLocal,
  );
  const historico = cautelas.filter(
    (c) =>
      c.decisaoLocal || c.status === "Aprovado" || c.status === "Reprovado",
  );

  const isSomenteLeitura = (c: CautelaComDecisao) =>
    c.decisaoLocal !== undefined ||
    c.status === "Aprovado" ||
    c.status === "Reprovado";

  function aprovar(id: string) {
    setCautelas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, decisaoLocal: "aprovado" } : c)),
    );
    setCautelaSelecionada(null);
    setModalAprovado(true);
  }

  function abrirDescartar(id: string) {
    setCautelaSelecionada(cautelas.find((c) => c.id === id) ?? null);
    setModalDescartar(true);
  }

  function confirmarDescartar(justificativa: string) {
    if (cautelaSelecionada) {
      setCautelas((prev) =>
        prev.map((c) =>
          c.id === cautelaSelecionada.id
            ? { ...c, decisaoLocal: "reprovado", motivoNegativa: justificativa }
            : c,
        ),
      );
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

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="bg-white rounded-sm border border-black">
                <DetalhesCautela
                  cautela={cautelaSelecionada}
                  onAprovar={() => aprovar(cautelaSelecionada.id)}
                  onDescartar={() => abrirDescartar(cautelaSelecionada.id)}
                  somenteLeitura={isSomenteLeitura(cautelaSelecionada)}
                />
              </div>
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
      <div className="hidden md:flex h-screen pt-[60px] pl-[70px] bg-[#F5F7F6] overflow-hidden">
        {/* Painel esquerdo — Respondidos */}
        <div className="w-[460px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 bg-[#F5F7F6]">
          <div className="bg-[#22592A] px-5 py-4">
            <h2 className="text-white font-bold text-base">Respondidos</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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

        {/* Painel central — Detalhes (aparece quando clica num card) */}
        {cautelaSelecionada && (
          <div className="w-[420px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <DetalhesCautela
              cautela={cautelaSelecionada}
              onAprovar={() => aprovar(cautelaSelecionada.id)}
              onDescartar={() => abrirDescartar(cautelaSelecionada.id)}
            />
          </div>
        )}

        {/* Painel direito — Histórico */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F6]">
          <div className="bg-[#22592A] px-5 py-4">
            <h2 className="text-white font-bold text-base">Histórico</h2>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {historico.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
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
                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
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
                    <svg
                      width="100%"
                      height="2"
                      viewBox="0 0 530 2"
                      fill="none"
                    >
                      <line x1="0" y1="1" x2="530" y2="1" stroke="#E5E7EB" />
                    </svg>
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
    </>
  );
}
