import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { ListaCautelados } from "../components/TabelaCautelados";

export function CardCautelaSolicitante({
  cautela,
  isNaoLida,
  onClick,
}: {
  cautela: Cautela;
  isNaoLida: boolean;
  onClick: () => void;
}) {
  const status = cautela.status as StatusCautela;
  const borderClass = isNaoLida
    ? "border-2 border-amber-400 bg-[#FFFBEB]"
    : status === "Saída Autorizada"
      ? "border border-amber-300 bg-amber-50"
      : "border border-[#D1D5DB] bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 w-full max-w-[440px] mx-auto ${borderClass}`}
    >
      {isNaoLida && (
        <div className="w-full text-center text-[13px] font-bold text-[#404040] bg-[#FCE96A] rounded-md py-1 mb-2">
          Novo
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AvatarStatus status={status} />
          <div>
            <p className="text-[14px] font-bold leading-tight text-[#404040] break-words text-left">
              {cautela.visitante || "Nome do proprietário"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          <BadgeStatus status={status} etapaFluxo={cautela.etapaFluxo} />
          {cautela.tipoPermissao &&
            (status === "Aprovado" || status === "Saída Autorizada") && (
              <p className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold bg-[#FCE96A] text-black">
                {cautela.tipoPermissao === "LIVRE_TRANSITO"
                  ? "Livre acesso"
                  : "Entrada única"}
              </p>
            )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mt-1">
        <div>
          <p className="text-[14px] text-[#404040]">
            Data: {cautela.data || "00/00/0000"}
          </p>
          <p className="text-[14px] text-[#404040] mt-0.5">
            Ciente:{" "}
            <span className="font-bold text-[14px]">
              {(cautela.gestor || "").toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
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

        <div className="flex-shrink-0">
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
    </div>
  );
}
