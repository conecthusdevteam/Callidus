import type { Cautela } from "../data/cautelaTypes";
import { BannerStatus, JustificativaBox } from "../components/BannerStatus";
import { TabelaCautelados } from "../components/TabelaCautelados";

export function DetalhesCautelaSolicitante({
  cautela,
  onFechar,
}: {
  cautela: Cautela;
  onFechar: () => void;
}) {
  const permissaoEditadaLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "LIVRE TRÂNSITO"
      : "ENTRADA ÚNICA";
  const statusFinalizadoLabel =
    cautela.status === "Reprovado" ? "Reprovado" : "Aprovado";
  const statusFinalizadoEm =
    cautela.status === "Reprovado" ? cautela.reprovadoEm : cautela.aprovadoEm;
  const progresso = [
    {
      label: "Pedido realizado",
      data: cautela.data?.split(", ")[1],
      complete: true,
    },
    {
      label: cautela.status === "Reprovado" ? "Reprovado" : "Cautela Aprovada",
      data:
        cautela.status === "Reprovado"
          ? cautela.reprovadoEm
          : cautela.aprovadoEm,
      complete:
        cautela.status !== "Em análise" || cautela.etapaFluxo !== "SOLICITADA",
    },
    {
      label:
        cautela.status === "Encerrada"
          ? "Encerrada"
          : cautela.status === "Saída Autorizada"
            ? "Saída Autorizada"
            : "Ativa",
      data: cautela.entradaValidadaEm,
      complete:
        (cautela.status === "Aprovado" &&
          cautela.etapaFluxo !== "APROVADA_PELO_GESTOR") ||
        cautela.status === "Saída Autorizada" ||
        cautela.status === "Encerrada",
    },
  ];

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
          <div className="mb-4 text-center text-[13px] text-[#6B7280]">
            <p className="mt-1">
              Acesso da cautela editado para{" "}
              <span className="font-bold">{permissaoEditadaLabel}</span> em{" "}
              {cautela.tipoPermissaoAlteradoEm}
            </p>
          </div>
        )}
        <div className="float-right ml-5 mb-5 w-[160px]">
          <p className="text-[12px] text-center font-bold text-[#404040] mb-4">
            Acompanhe seu pedido de cautela
          </p>
          <div>
            {progresso.map((item, index) => (
              <div key={item.label} className="flex gap-2 items-start">
                <div className="flex flex-col min-w-0 text-center flex-1">
                  <p
                    className={`text-[10px] leading-tight ${item.complete ? "text-black" : "text-[#BDBDBD]"}`}
                  >
                    {item.label}
                  </p>
                </div>
                <div className="flex flex-col items-center flex-shrink-0">
                  <span
                    className={`h-4 w-4 rounded-full ${item.complete ? "bg-[#3BB14A]" : "bg-[#BDBDBD]"}`}
                  />
                  {index < progresso.length - 1 && (
                    <span
                      className={`w-0.5 h-40 ${progresso[index + 1].complete ? "bg-[#3BB14A]" : "bg-[#BDBDBD]"}`}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <p className="text-[12px] text-[#404040]">
                    {item.data?.split(", ")[1] ?? item.data ?? ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Id da cautela</p>
          <p className="text-sm text-gray-700 break-all">{cautela.customId}</p>
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
        {cautela.validade && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Válido até:</p>
            <p className="text-sm text-gray-700">{cautela.validade}</p>
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
    </div>
  );
}
