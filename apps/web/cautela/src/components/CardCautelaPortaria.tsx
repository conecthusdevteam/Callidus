import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { BannerCard } from "../pages/Portaria";
import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { ListaCautelados } from "../components/TabelaCautelados";

export function CardCautelaPortaria({
  cautela,
  isNaoLida,
  isSelected,
  onClick,
  onAprovarEntrada,
  onAprovarSaida,
}: {
  cautela: Cautela;
  isNaoLida: boolean;
  isSelected: boolean;
  onClick: () => void;
  onAprovarEntrada?: (id: string) => void;
  onAprovarSaida?: (id: string) => void;
}) {
  const status = cautela.status as StatusCautela;
  const borderClass = isSelected
    ? "border-2 border-[#22592A] bg-white"
    : isNaoLida
      ? "border-2 border-amber-300 bg-[#FFFAD8]"
      : status === "Em análise"
        ? "border border-[#FACA15] bg-[#FFFDE7]"
        : status === "Saída Autorizada"
          ? "border border-amber-300 bg-white"
          : status === "Aprovado"
            ? "border border-[#34D399] bg-white"
            : "border border-[#D1D5DB] bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 w-full max-w-[440px] mx-auto ${borderClass}`}
    >
      <BannerCard status={status} />

      <div className="flex items-start justify-between gap-3 mb-2">
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
          {isNaoLida && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mt-0.5">
              Nova
            </span>
          )}
        </div>
      </div>

      <p className="text-[14px] text-[#404040] mt-1">
        Data: {cautela.data || "00/00/0000"}
      </p>
      <p className="text-[14px] text-[#404040] mt-0.5">
        Ciente:{" "}
        <span className="font-bold text-[14px]">
          {(cautela.gestor || "").toUpperCase()}
        </span>
      </p>

      <div className="border-t border-black my-3" />

      <div className="flex justify-between items-end gap-4">
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#404040] mb-1">
            Cautelados:
          </p>
          <ListaCautelados equipamentos={cautela.equipamentos ?? []} max={3} />
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {status === "Em análise" && (
            <button
              disabled
              className="px-5 py-2 rounded-lg bg-[#D1D5DB] text-[#9CA3AF] text-sm font-semibold cursor-not-allowed"
            >
              Aprovar entrada
            </button>
          )}
          {status === "Aprovado" && onAprovarEntrada && (
            <button
              onClick={() => onAprovarEntrada(cautela.id)}
              className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
            >
              Aprovar entrada
            </button>
          )}
          {status === "Saída Autorizada" && onAprovarSaida && (
            <button
              onClick={() => onAprovarSaida(cautela.id)}
              className="px-5 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
            >
              Aprovar saída
            </button>
          )}
        </div>
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
