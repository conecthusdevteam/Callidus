import { BadgeTabela } from "./BadgeTabelaPortaria";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";

export type TabelaVariant = "portaria" | "gestor";

export interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
}

export interface TabelaHistoricoProps {
  variant: TabelaVariant;

  itens: CautelaComDecisao[];

  totalItens: number;

  cautelaSelecionadaId?: string | null;
  onClickLinha: (cautela: CautelaComDecisao) => void;

  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onPesquisar: () => void;

  paginaAtual: number;
  totalPaginas: number;
  onPaginaAnterior: () => void;
  onProximaPagina: () => void;
  onIrParaPagina: (pagina: number) => void;

  onTipoAcessoChange?: (
    cautela: CautelaComDecisao,
    valor: "livre" | "entrada",
  ) => void;

  itensPorPagina?: number;
}

function formatarData(valor: string): { data: string; hora: string } {
  if (!valor) return { data: "", hora: "--:--" };
  if (valor.includes(", ")) {
    const [data, hora] = valor.split(", ");
    return { data, hora };
  }
  try {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return { data: valor, hora: "--:--" };
    return {
      data: d.toLocaleDateString("pt-BR"),
      hora: d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { data: valor, hora: "--:--" };
  }
}

function ultimaAcaoData(cautela: Cautela): string {
  return cautela.atualizadoEm || cautela.data;
}

function paginasVisiveis(
  pagina: number,
  totalPaginas: number,
): (number | "...")[] {
  if (totalPaginas <= 7)
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (pagina > 3) pages.push("...");
  for (
    let p = Math.max(2, pagina - 1);
    p <= Math.min(totalPaginas - 1, pagina + 1);
    p++
  ) {
    pages.push(p);
  }
  if (pagina < totalPaginas - 2) pages.push("...");
  pages.push(totalPaginas);
  return pages;
}

function BadgeHistoricoGestor({
  status,
  etapaFluxo,
}: {
  status: StatusCautela;
  etapaFluxo?: string;
}) {
  if (status === "Aprovado" && etapaFluxo === "APROVADA_PELO_GESTOR") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-amber-400 bg-amber-100 text-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
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

export function Tabela({
  variant,
  itens,
  totalItens,
  cautelaSelecionadaId,
  onClickLinha,
  searchTerm,
  onSearchTermChange,
  onPesquisar,
  paginaAtual,
  totalPaginas,
  onPaginaAnterior,
  onProximaPagina,
  onIrParaPagina,
  onTipoAcessoChange,
  itensPorPagina = 6,
}: TabelaHistoricoProps) {
  const isPortaria = variant === "portaria";

  const gridCols = isPortaria
    ? "grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.25fr_1.35fr]"
    : "grid-cols-[1.8fr_0.9fr_0.75fr_1.8fr_1.25fr_1.35fr_52px]";

  return (
    <div className="w-full flex flex-col gap-0">
      {/* Barra de pesquisa */}
      <div
        className={`flex items-center gap-3 mb-4 ${
          isPortaria
            ? "w-full max-w-[607px] ml-[335px] mb-[39px]"
            : "w-full max-w-[607px] ml-[335px] mb-[39px]"
        }`}
      >
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="w-4 h-4"
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
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Pesquise por nome, do solicitante, Id de cautela ou status"
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
          />
        </div>
        <button
          onClick={onPesquisar}
          className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap"
        >
          Pesquisar
        </button>
      </div>

      {/* Tabela */}
      <div
        className={`w-full bg-white rounded-lg border border-[#E5E7EB] shadow-sm relative z-0 overflow-x-auto ${
          !isPortaria ? "max-w-[1126px] ml-[73px]" : "max-w-[1200px] ml-[60px]"
        }`}
      >
        {/* Cabeçalho */}
        <div
          className={`grid ${gridCols} bg-[#2B8E37] text-white text-[18px] font-bold px-4 py-${isPortaria ? "2" : "2"} min-w-[800px]`}
        >
          <span>Solicitante</span>
          <span>Data</span>
          <span>Hora</span>
          <span className={isPortaria ? "" : "flex justify-center"}>
            Id da cautela
          </span>
          <span className="flex justify-center">Status</span>
          <span className="flex justify-center">Tipo</span>
          {isPortaria && <span className="flex justify-center">Aprovador</span>}
        </div>

        {/* Linhas */}
        <div
          className="overflow-y-auto"
          style={isPortaria ? { maxHeight: "calc(100vh - 320px)" } : undefined}
        >
          {itens.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm">
              {searchTerm
                ? `Nenhum resultado para "${searchTerm}".`
                : "Nenhum histórico."}
            </div>
          ) : (
            itens.map((cautela, i) => {
              const { data, hora } = formatarData(ultimaAcaoData(cautela));
              const selecionada = cautelaSelecionadaId === cautela.id;
              const statusEfetivo: StatusCautela =
                cautela.decisaoLocal === "aprovado"
                  ? "Aprovado"
                  : cautela.decisaoLocal === "reprovado"
                    ? "Reprovado"
                    : (cautela.status as StatusCautela);

              const podeEditarAcesso =
                !isPortaria &&
                cautela.status !== "Reprovado" &&
                cautela.status !== "Encerrada";

              return (
                <div
                  key={cautela.id}
                  onClick={() => onClickLinha(cautela)}
                  className={`grid ${gridCols} px-4 py-3 text-[18px] min-w-[800px] text-[#111827] items-center cursor-pointer transition-colors border-b border-[#F3F4F6] last:border-0 ${
                    selecionada
                      ? "bg-[#E8F5EA] border-l-4 border-l-[#2B8E37]"
                      : i % 2 === 1
                        ? "bg-[#F9FAFB] hover:bg-[#F0FDF4]"
                        : "bg-white hover:bg-[#F0FDF4]"
                  }`}
                >
                  {/* Solicitante */}
                  <span
                    className={`${!isPortaria ? "text-[18px]" : ""} truncate`}
                  >
                    {cautela.visitante || "—"}
                  </span>

                  {/* Data */}
                  <span
                    className={`${!isPortaria ? "text-[18px]" : ""} text-[#0A0A0A]`}
                  >
                    {data}
                  </span>

                  {/* Hora */}
                  <span
                    className={`${!isPortaria ? "text-[18px]" : ""} text-[#0A0A0A]`}
                  >
                    {hora}
                  </span>

                  {/* Id */}
                  <span
                    className={`${isPortaria ? "text-[18px]" : "text-[18px] flex justify-center"} text-[#0A0A0A]`}
                  >
                    {cautela.customId}
                  </span>

                  {/* Status */}
                  <span className="flex justify-center">
                    {isPortaria ? (
                      <BadgeTabela status={statusEfetivo} />
                    ) : (
                      <BadgeHistoricoGestor
                        status={statusEfetivo}
                        etapaFluxo={cautela.etapaFluxo}
                      />
                    )}
                  </span>

                  {/* Tipo */}
                  <span className="flex justify-center truncate">
                    {isPortaria ? (
                      cautela.status === "Reprovado" ? (
                        "Sem Acesso"
                      ) : cautela.livreAcesso === "livre" ? (
                        "Livre trânsito"
                      ) : (
                        "Entrada única"
                      )
                    ) : podeEditarAcesso ? (
                      <select
                        value={cautela.livreAcesso ?? "entrada"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onTipoAcessoChange?.(
                            cautela,
                            e.target.value as "livre" | "entrada",
                          );
                        }}
                        className="text-[13px] border border-[#D1D5DB] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2B8E37] cursor-pointer"
                      >
                        <option value="entrada">Entrada única</option>
                        <option value="livre">Livre trânsito</option>
                      </select>
                    ) : (
                      <span className="text-[14px] text-[#6B7280]">
                        {cautela.status === "Reprovado"
                          ? "Sem acesso"
                          : cautela.livreAcesso === "livre"
                            ? "Livre trânsito"
                            : "Entrada única"}
                      </span>
                    )}
                  </span>

                  {/* Aprovador — apenas Portaria */}
                  {isPortaria && (
                    <span className="flex justify-center truncate">
                      {cautela.gestor || "—"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Paginação */}
        {totalItens > itensPorPagina && (
          <div className="flex items-center justify-center gap-1 py-3 border-t border-[#E5E7EB]">
            <button
              onClick={onPaginaAnterior}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {paginasVisiveis(paginaAtual, totalPaginas).map((p, i) =>
              p === "..." ? (
                <span
                  key={`e-${i}`}
                  className="px-2 py-1.5 text-[13px] text-[#9CA3AF]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onIrParaPagina(p as number)}
                  className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                    paginaAtual === p
                      ? "bg-[#2B8E37] text-white"
                      : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={onProximaPagina}
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
