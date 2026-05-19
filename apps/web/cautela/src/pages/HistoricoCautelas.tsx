/**
 * HistoricoCautelas.tsx
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCautelas } from "../lib/api";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import DetalhesCautela from "../components/DetalhesCautela";

const ITENS_POR_PAGINA = 9;

function BadgeStatus({ status }: { status: StatusCautela }) {
  if (status === "Em análise" || status === "Saída Autorizada") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#FACA15] bg-[#FFFBEB] text-[#92400E]">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        Em análise
      </span>
    );
  }
  if (status === "Aprovado") {
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#31C48D] bg-[#F0FDF4] text-[#065F46]">
        <span className="w-2 h-2 rounded-full bg-[#0E9F6E]" />
        Aprovado
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
  if (status === "Encerrada")
    return (
      <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[12px] font-semibold border border-[#A3A3A3] bg-[#F4F4F4] text-[#525252]">
        <span className="w-2 h-2 rounded-full bg-[#A3A3A3]" />
        Encerrado
      </span>
    );
}

function formatarData(valor: string): { data: string; hora: string } {
  if (!valor) return { data: "", hora: "--:--" };
  
  if (valor.includes(', ')) {
    const [data, hora] = valor.split(', ');
    return { data, hora };
  }
  
  try {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return { data: valor, hora: "--:--" };
    
    return {
      data: d.toLocaleDateString("pt-BR"),
      hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
  } catch {
    return { data: valor, hora: "--:--" };
  }
}

interface HistoricoCautelasProps {
  voltarPara: string;
}

export default function HistoricoCautelas({
  voltarPara,
}: HistoricoCautelasProps) {
  const navigate = useNavigate();

  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [termoPesquisado, setTermoPesquisado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cautelaSelecionada, setCautelaSelecionada] = useState<Cautela | null>(
    null,
  );

  useEffect(() => {
    getCautelas()
      .then(setCautelas)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Erro ao carregar histórico."),
      )
      .finally(() => setLoading(false));
  }, []);

  const cautelasFiltradas = cautelas.filter((c) => {
    if (!termoPesquisado.trim()) return true;
    const q = termoPesquisado.toLowerCase().trim();
    return (
      c.id.toLowerCase().includes(q) ||
      c.visitante?.toLowerCase().includes(q) ||
      c.gestor?.toLowerCase().includes(q) ||
      c.empresa?.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(cautelasFiltradas.length / ITENS_POR_PAGINA),
  );
  const itensPagina = cautelasFiltradas.slice(
    (pagina - 1) * ITENS_POR_PAGINA,
    pagina * ITENS_POR_PAGINA,
  );

  function pesquisar() {
    setTermoPesquisado(termoBusca);
    setPagina(1);
    setCautelaSelecionada(null);
  }

  function irParaPagina(p: number) {
    if (p >= 1 && p <= totalPaginas) {
      setPagina(p);
      setCautelaSelecionada(null);
    }
  }

  function paginasVisiveis(): (number | "...")[] {
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

  return (
    <div className="min-h-screen pt-[60px] pl-0 md:pl-[70px] bg-[#F5F7F6]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-8">
          <button
            onClick={() => navigate(voltarPara)}
            className="hover:text-[#2B8E37] transition-colors"
          >
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
              />
            </svg>
          </button>
          <span className="text-[#D1D5DB]">|</span>
          <button
            onClick={() => navigate(voltarPara)}
            className="hover:text-[#2B8E37] transition-colors"
          >
            Solicitações de cautela
          </button>
          <svg
            className="w-3 h-3 text-[#9CA3AF]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-[#111827] font-medium">
            Histórico de cautela
          </span>
        </nav>

        {/* Barra de pesquisa */}
        <div className="flex items-center gap-3 mb-8 max-w-2xl mx-auto">
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
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pesquisar()}
              placeholder="Pesquise por nome, do proprietário, Id de cautela ou status"
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
            />
          </div>
          <button
            onClick={pesquisar}
            className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap"
          >
            Pesquisar
          </button>
        </div>

        {/* Layout tabela + painel lateral */}
        <div className="flex gap-6 items-start">
          {/* Tabela */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg overflow-hidden border border-[#E5E7EB] shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1.5fr_2fr] bg-[#2B8E37] text-white text-[13px] font-bold px-4 py-3">
                <span>Solicitante</span>
                <span>Data</span>
                <span>Hora</span>
                <span>Id da cautela</span>
                <span>Status</span>
                <span>Aprovador</span>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm">
                  Carregando...
                </div>
              )}
              {erro && (
                <div className="flex items-center justify-center py-16 text-red-500 text-sm">
                  {erro}
                </div>
              )}
              {!loading && !erro && cautelasFiltradas.length === 0 && (
                <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm">
                  {termoPesquisado
                    ? `Nenhum resultado para "${termoPesquisado}".`
                    : "Nenhuma cautela encontrada."}
                </div>
              )}

              {!loading &&
                !erro &&
                itensPagina.map((cautela, i) => {
                  console.log("Date: ", cautela.data);
                  const { data, hora } = formatarData(cautela.data);
                  const selecionada = cautelaSelecionada?.id === cautela.id;
                  return (
                    <div
                      key={cautela.id}
                      onClick={() =>
                        setCautelaSelecionada((prev) =>
                          prev?.id === cautela.id ? null : cautela,
                        )
                      }
                      className={`grid grid-cols-[2fr_1fr_1fr_2fr_1.5fr_2fr] px-4 py-3 text-[13px] text-[#111827] items-center cursor-pointer transition-colors border-b border-[#F3F4F6] last:border-0 ${
                        selecionada
                          ? "bg-[#E8F5EA] border-l-4 border-l-[#2B8E37]"
                          : i % 2 === 1
                            ? "bg-[#F9FAFB] hover:bg-[#F0FDF4]"
                            : "bg-white hover:bg-[#F0FDF4]"
                      }`}
                    >
                      <span className="truncate">
                        {cautela.visitante || "—"}
                      </span>
                      <span className="text-[#6B7280]">{data}</span>
                      <span className="text-[#6B7280]">{hora}</span>
                      <span className="truncate font-mono text-[12px] text-[#6B7280]">
                        {cautela.id}
                      </span>
                      <BadgeStatus status={cautela.status} />
                      <span className="truncate">{cautela.gestor || "—"}</span>
                    </div>
                  );
                })}
            </div>

            {/* Paginação */}
            {!loading && !erro && totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                <button
                  onClick={() => irParaPagina(pagina - 1)}
                  disabled={pagina === 1}
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {paginasVisiveis().map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 py-1.5 text-[13px] text-[#9CA3AF]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => irParaPagina(p as number)}
                      className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                        pagina === p
                          ? "bg-[#2B8E37] text-white"
                          : "text-[#6B7280] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => irParaPagina(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#2B8E37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}

            {/* Botão Voltar */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate(voltarPara)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm font-medium hover:bg-[#F3F4F6] transition-colors"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Voltar
              </button>
            </div>
          </div>
          {/* Painel lateral de detalhes */}
          {cautelaSelecionada && (
            <div className="w-[360px] flex-shrink-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-y-auto max-h-[calc(100vh-160px)] sticky top-[80px]">
              <DetalhesCautela
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
