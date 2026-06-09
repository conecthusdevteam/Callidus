import type { Cautela } from "../data/cautelaTypes";
import { BannerStatus, JustificativaBox } from "../components/BannerStatus";
import { TabelaCautelados } from "../components/TabelaCautelados";

export function DetalhesCautelaPortaria({
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
