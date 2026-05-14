import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { AvatarStatus } from "./AvatarStatus";
import { BadgeStatus } from "./BadgeStatus";
import { ListaCautelados } from "./TabelaCautelados";

interface CardCautelaHistoricoProps {
  cautela: Cautela;
  isNaoLida?: boolean;
  statusExibido?: StatusCautela;
  onClick: () => void;
}

export function CardCautelaHistorico({
  cautela,
  isNaoLida = false,
  statusExibido,
  onClick,
}: CardCautelaHistoricoProps) {
  const status = (statusExibido ?? cautela.status) as StatusCautela;

  const borderClass = isNaoLida
    ? "border-2 border-amber-400 bg-[#FFFBEB]"
    : cautela.status === "Saída Autorizada"
      ? "border border-amber-300 bg-amber-50"
      : "border border-[#D1D5DB] bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AvatarStatus status={cautela.status as StatusCautela} />
          <p className="text-[16px] font-bold leading-tight text-[#404040]">
            {cautela.visitante || "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          <BadgeStatus status={status} />
          {cautela.status === "Saída Autorizada" && (
            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-100 text-amber-800 border border-amber-400">
              ⚠ Aguardando saída
            </span>
          )}
          {isNaoLida && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mt-0.5">
              Nova
            </span>
          )}
        </div>
      </div>

      <p className="text-[14px] text-[#404040] mt-1">
        Data: {cautela.data || "—"}
      </p>
      <p className="text-[14px] text-[#404040] mt-0.5">
        Ciente:{" "}
        <span className="font-bold">
          {(cautela.gestor || "").toUpperCase()}
        </span>
      </p>

      <div className="border-t border-black my-3" />

      <p className="text-[15px] font-medium text-[#404040] mb-1">Cautelados:</p>
      <ListaCautelados equipamentos={cautela.equipamentos ?? []} max={3} />

      <div className="flex justify-end">
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
  );
}
