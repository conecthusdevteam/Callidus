import { useState } from "react";
import { type StatusCautela } from "../data/cautelaTypes";
import { BadgeHistorico } from "./BadgeHistorico";
import { type CautelaComDecisao } from "./Tabela";

export function MenuHistorico({
  historico,
  searchTerm,
  onSearchTermChange,
  onVoltar,
  onClickLinha,
  statusHistorico,
}: {
  historico: CautelaComDecisao[];
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  onVoltar: () => void;
  onClickLinha: (c: CautelaComDecisao) => void;
  statusHistorico: (c: CautelaComDecisao) => StatusCautela;
}) {
  const [termoBusca, setTermoBusca] = useState(searchTerm);

  function handleChange(v: string) {
    setTermoBusca(v);
    onSearchTermChange(v);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-3 mt-16 mb-6">
        <button onClick={onVoltar} className="text-[#404040]">
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
        <span className="text-[16px] text-[#171717]">
          Home <span className="mx-1">›</span> Histórico
        </span>
      </div>

      {/* Barra de pesquisa */}
      <div className="px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Pesquise por nome, do proprietário, Id de cautela ou status"
              className="w-full pl-4 pr-3 py-2.5 text-[14px] border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37]"
            />
          </div>
          <button
            onClick={() => onSearchTermChange(termoBusca)}
            className="px-3 py-2.5 rounded-lg bg-[#3BB14A] text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="bg-[#22592A] px-4 py-3 rounded-t-lg">
          <h2 className="text-white font-bold text-base text-center">
            Histórico
          </h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden mb-4">
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
                      : c.status === "Em validação"
                        ? "bg-[#FCE96A] border-l-[#FACA15]"
                        : c.status === "Aprovado"
                          ? "bg-[#BCF0DA] border-l-[#0E9F6E]"
                          : c.status === "Saída Autorizada"
                            ? "bg-amber-200 border-l-amber-400"
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
                    <BadgeHistorico
                      status={statusHistorico(c)}
                      etapaFluxo={c.etapaFluxo}
                    />
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
    </div>
  );
}
