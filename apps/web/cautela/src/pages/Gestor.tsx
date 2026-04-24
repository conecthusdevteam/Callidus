import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import ModalDescartar from "../components/ModalDescartar";
import {
  mockCautelas,
  type Cautela,
  type StatusCautela,
} from "../data/mockData";

function LineSeparator() {
  return (
    <svg width="100%" height="2" viewBox="0 0 530 2" fill="none">
      <line x1="0" y1="1" x2="530" y2="1" stroke="#E5E7EB" />
    </svg>
  );
}

type Tab = "recebidas" | "historico";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
}

function CardCautela({
  cautela,
  index,
  onAprovar,
  onDescartar,
  showBotoes,
}: {
  cautela: CautelaComDecisao;
  index: number;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
  showBotoes: boolean;
}) {
  const isPrimeiro = index === 0 && showBotoes;

  return (
    <div
      className={`rounded-xl p-5 border ${
        isPrimeiro ? "border-red-400 bg-red-100" : "border-gray-200"
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
            <span className="mt-0.5">•</span>
            {eq.descricao}
          </li>
        ))}
      </ul>

      {showBotoes ? (
        <div className="flex gap-3">
          <button
            onClick={() => onAprovar(cautela.id)}
            className="flex-1 md:flex-none md:px-5 py-2 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
          >
            Aprovar
          </button>
          <button
            onClick={() => onDescartar(cautela.id)}
            className="flex-1 md:flex-none md:px-5 py-2 rounded-lg bg-white border border-black text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Descartar
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          {(() => {
            const statusExibido =
              cautela.decisaoLocal === "aprovado"
                ? "Aprovado"
                : cautela.decisaoLocal === "reprovado"
                  ? "Reprovado"
                  : cautela.status;
            return <StatusBadge status={statusExibido as StatusCautela} />;
          })()}
        </div>
      )}
    </div>
  );
}

export default function Gestor() {
  const [activeTab, setActiveTab] = useState<Tab>("recebidas");
  const [cautelas, setCautelas] = useState<CautelaComDecisao[]>(mockCautelas);
  const [modalAberto, setModalAberto] = useState(false);
  const [cautelaSelecionada, setCautelaSelecionada] = useState<string | null>(
    null,
  );

  const recebidas = cautelas.filter(
    (c) => c.status === "Em análise" && !c.decisaoLocal,
  );
  const historico = cautelas.filter(
    (c) =>
      c.decisaoLocal || c.status === "Aprovado" || c.status === "Reprovado",
  );
  const listaAtiva = activeTab === "recebidas" ? recebidas : historico;

  function aprovar(id: string) {
    setCautelas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, decisaoLocal: "aprovado" } : c)),
    );
  }

  function abrirDescartar(id: string) {
    setCautelaSelecionada(id);
    setModalAberto(true);
  }

  function confirmarDescartar(justificativa: string) {
    if (cautelaSelecionada) {
      setCautelas((prev) =>
        prev.map((c) =>
          c.id === cautelaSelecionada
            ? { ...c, decisaoLocal: "reprovado", motivoNegativa: justificativa }
            : c,
        ),
      );
    }
    setModalAberto(false);
    setCautelaSelecionada(null);
  }

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="md:hidden flex flex-col h-screen px-4 pt-[60px] bg-[#F5F7F6] border">
        {/* Abas */}
        <div className="relative flex-shrink-0 mt-6">
          <button
            onClick={() => setActiveTab("historico")}
            className={`w-full h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all ${
              activeTab === "historico"
                ? "bg-[#22592A] text-white"
                : "bg-[#C4EEC9] text-[#2B8E37]"
            }`}
            style={{ paddingLeft: "48%" }}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab("recebidas")}
            className={`absolute top-0 left-0 w-[48%] h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
              activeTab === "recebidas"
                ? "bg-[#22592A] text-white"
                : "bg-[#C4EEC9] text-[#22592A]"
            }`}
          >
            Recebidas
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {listaAtiva.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-10">
              Nenhuma cautela.
            </p>
          )}
          {listaAtiva.map((cautela, index) => (
            <CardCautela
              key={cautela.id}
              cautela={cautela}
              index={index}
              onAprovar={aprovar}
              onDescartar={abrirDescartar}
              showBotoes={activeTab === "recebidas"}
            />
          ))}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex h-screen pt-[60px] pl-[70px] bg-[#F5F7F6] overflow-hidden">
        {/* Painel esquerdo — lista resumida */}
        <div
          className="w-80 flex-shrink-0 flex flex-col overflow-hidden bg-white border-r border-gray-200"
          style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.10)" }}
        >
          <div className="flex flex-shrink-0">
            <button
              onClick={() => setActiveTab("recebidas")}
              className={`flex-1 py-4 text-base font-bold transition-all ${
                activeTab === "recebidas"
                  ? "bg-[#22592A] text-white"
                  : "bg-[#C4EEC9] text-[#2B8E37]"
              }`}
            >
              Recebidas
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`flex-1 py-4 text-base font-bold transition-all ${
                activeTab === "historico"
                  ? "bg-[#22592A] text-white"
                  : "bg-[#C4EEC9] text-[#2B8E37]"
              }`}
            >
              Histórico
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listaAtiva.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                Nenhuma cautela.
              </p>
            )}
            {listaAtiva.map((cautela, index) => {
              const statusExibido =
                cautela.decisaoLocal === "aprovado"
                  ? "Aprovado"
                  : cautela.decisaoLocal === "reprovado"
                    ? "Reprovado"
                    : cautela.status;

              return (
                <div key={cautela.id}>
                  <div className="px-3 py-3 bg-white hover:bg-gray-50 transition-colors">
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
                  {index < listaAtiva.length - 1 && <LineSeparator />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel direito — cards de ação */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {listaAtiva.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-10">
              Nenhuma cautela.
            </p>
          )}
          {listaAtiva.map((cautela, index) => (
            <CardCautela
              key={cautela.id}
              cautela={cautela}
              index={index}
              onAprovar={aprovar}
              onDescartar={abrirDescartar}
              showBotoes={activeTab === "recebidas"}
            />
          ))}
        </div>
      </div>

      {/* Modal descartar */}
      {modalAberto && (
        <ModalDescartar
          onConfirmar={confirmarDescartar}
          onCancelar={() => {
            setModalAberto(false);
            setCautelaSelecionada(null);
          }}
        />
      )}
    </>
  );
}
