/**
 * DetalhesCautela.tsx
 *
 * Painel de detalhes de uma cautela — reutilizável em Home, Gestor e HistoricoCautelas.
 */

import type { Cautela } from "../data/cautelaTypes";

interface DetalhesCautelaProps {
  cautela: Cautela;
  onFechar: () => void;
  onLiberarSaida?: () => void;
}

export default function DetalhesCautela({
  cautela,
  onFechar,
  onLiberarSaida,
}: DetalhesCautelaProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Banner de status */}
        <div className="mb-4">
          {cautela.status === "Saída Autorizada" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Atenção — Ação necessária
            </div>
          ) : cautela.status === "Aprovado" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#BCF0DA] border border-[#31C48D] text-[#065F46] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Aprovado {cautela.aprovadoEm ? `em ${cautela.aprovadoEm}` : ""}
            </div>
          ) : cautela.status === "Encerrada" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#F4F4F4] border border-[#A3A3A3] text-[#525252] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Encerrada {cautela.encerradaEm ? `em ${cautela.encerradaEm}` : ""}
            </div>
          ) : cautela.status === "Reprovado" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FBD5D5] border border-[#F05252] text-[#9B1C1C] text-[13px] font-medium">
              Reprovado {cautela.reprovadoEm ? `em ${cautela.reprovadoEm}` : ""}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[13px] font-medium">
              Em análise
            </div>
          )}
        </div>

        {/* Justificativa reprovado */}
        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-1">
              Justificativa:
            </p>
            <p className="text-sm text-red-700">{cautela.motivoNegativa}</p>
          </div>
        )}

        <div className="mb-3">
          <p className="text-sm font-bold text-black">Id da cautela</p>
          <p className="text-sm text-gray-700 break-all">{cautela.id}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Setor:</p>
          <p className="text-sm text-gray-700">{cautela.empresa || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Data e hora de entrada</p>
          <p className="text-sm text-gray-700">{cautela.data || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Proprietário</p>
          <p className="text-sm text-gray-700">{cautela.visitante || "-"}</p>
        </div>
        {cautela.proprietarioEmail && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              E-mail do proprietário
            </p>
            <p className="text-sm text-gray-700">{cautela.proprietarioEmail}</p>
          </div>
        )}
        {cautela.validade && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Válido até:</p>
            <p className="text-sm text-gray-700">{cautela.validade}</p>
          </div>
        )}
        {cautela.aprovadoEm && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Aprovado em:</p>
            <p className="text-sm text-gray-700">{cautela.aprovadoEm}</p>
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

        {cautela.equipamentos?.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black mb-2">Cautelados:</p>
            <table className="w-full overflow-hidden rounded-lg">
              <thead>
                <tr style={{ backgroundColor: "#0E9F6E" }}>
                  <th className="px-4 py-2 text-left text-white text-sm font-bold">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-center text-white text-sm font-bold">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {cautela.equipamentos.map((eq, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 even:bg-[#F4F4F4]"
                  >
                    <td className="px-4 py-2 text-sm text-[#0A0A0A]">
                      {eq.descricao}
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-[#0A0A0A]">
                      {eq.quantidade ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
        {cautela.status === "Saída Autorizada" && onLiberarSaida && (
          <button
            onClick={onLiberarSaida}
            className="w-full py-2.5 rounded-lg bg-[#F5F5F5] text-black text-sm font-semibold hover:bg-gray-300 transition-colors"
          >
            Liberar saída
          </button>
        )}
        <button
          onClick={onFechar}
          className="w-full py-2.5 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
        >
          Fechar detalhes
        </button>
      </div>
    </div>
  );
}
