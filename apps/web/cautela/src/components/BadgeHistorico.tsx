import { type StatusCautela } from "../data/cautelaTypes";

export function BadgeHistorico({
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
