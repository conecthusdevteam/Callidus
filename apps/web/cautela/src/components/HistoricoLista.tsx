import { type StatusCautela } from "../data/cautelaTypes";
import { type CautelaComDecisao } from "../components/Tabela";
import { BadgeHistorico } from "./BadgeHistorico";

export function HistoricoLista({
  historico,
  statusHistorico,
  onClickLinha,
}: {
  historico: CautelaComDecisao[];
  statusHistorico: (c: CautelaComDecisao) => StatusCautela;
  onClickLinha: (c: CautelaComDecisao) => void;
}) {
  return (
    <div className="mt-4 mb-2 -mx-3">
      <div className="bg-[#22592A] px-4 py-3 rounded-t-lg">
        <h2 className="text-white font-bold text-base text-center">
          Histórico
        </h2>
      </div>
      <div className="bg-white border border-gray-200 overflow-hidden">
        {historico.length === 0 ? (
          <p className="text-[13px] text-[#6B7280] text-center py-6">
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
                onClick={() => onClickLinha(c)}
                className={`px-4 py-3 cursor-pointer border-b border-[#F3F4F6] last:border-0 border-l-8 ${
                  c.status === "Reprovado"
                    ? "bg-[#FBD5D5] border-l-[#F05252]"
                    : c.status === "Aprovado"
                      ? "bg-[#BCF0DA] border-l-[#0E9F6E]"
                      : c.status === "Saída Autorizada"
                        ? "bg-amber-50 border-l-amber-400"
                        : c.status === "Encerrada"
                          ? "bg-[#F4F4F4] border-l-[#A3A3A3]"
                          : i % 2 === 1
                            ? "bg-[#F9FAFB] border-l-transparent"
                            : "bg-white border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#0A0A0A] font-mono">
                    {c.id}
                  </span>
                  <BadgeHistorico status={statusHistorico(c)} />
                </div>
                <p className="text-[18px] font-bold text-[#111827] mb-1">
                  {c.visitante || "—"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#0A0A0A]">
                    Data: {data} Hora: {hora}
                  </span>
                  {c.livreAcesso && (
                    <span className="text-[10px] font-bold text-[#0A0A0A]">
                      {c.livreAcesso === "livre"
                        ? "Livre acesso"
                        : "Entrada única"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
