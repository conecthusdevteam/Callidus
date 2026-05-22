import type { Cautela } from "../data/cautelaTypes";

interface DetalhesCautelaProps {
  cautela: Cautela;
  onFechar: () => void;
  acoes?: React.ReactNode;
  variant?: "recebida" | "historico";
  titulo?: string;
  cabecalho?: React.ReactNode;
}

export default function DetalhesCautela({
  cautela,
  onFechar,
  acoes,
  variant = "recebida",
  titulo,
  cabecalho,
}: DetalhesCautelaProps) {
  const bannerLabel =
    cautela.status === "Saída Autorizada"
      ? "Atenção - Solicitação de saída"
      : "Nova cautela solicitada";

  const bannerClass =
    cautela.status === "Saída Autorizada"
      ? "bg-red-100 text-red-600"
      : "bg-[#FCE96A] text-[#111827]";

  const badgeLabel = () => {
    if (cautela.status === "Aprovado")
      return `Aprovado ${cautela.aprovadoEm ? `em ${cautela.aprovadoEm}` : ""}`;
    if (cautela.status === "Reprovado")
      return `Reprovado ${cautela.reprovadoEm ? `em ${cautela.reprovadoEm}` : ""}`;
    if (cautela.status === "Encerrada")
      return `Encerrada ${cautela.encerradaEm ? `em ${cautela.encerradaEm}` : ""}`;
    if (cautela.status === "Saída Autorizada") return "Aguardando saída";
    return "Em análise";
  };

  const badgeClass = () => {
    if (cautela.status === "Aprovado" || cautela.status === "Saída Autorizada")
      return "bg-[#D1FAE5] border border-[#34D399] text-[#065F46]";
    if (cautela.status === "Reprovado")
      return "bg-[#FEE2E2] border border-[#F05252] text-[#9B1C1C]";
    if (cautela.status === "Encerrada")
      return "bg-[#F4F4F4] border border-[#A3A3A3] text-[#525252]";
    return "bg-[#FCE96A] border border-[#F5D800] text-[#111827]";
  };

  return (
    <div className="relative bg-white rounded-sm shadow-2xl w-full overflow-hidden border border-black">
      {/* Botão fechar */}
      <button
        onClick={onFechar}
        className="absolute top-3 right-3 text-black hover:text-gray-500 z-10"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Banner — só para recebidas */}
      {variant === "recebida" && (
        <div className="px-4 pt-10 pb-1">
          <div
            className={`w-full text-center py-1 text-[13px] font-bold rounded-lg ${bannerClass}`}
          >
            {bannerLabel}
          </div>
        </div>
      )}

      {titulo && (
        <div className="px-6 pt-5 pb-2 text-center">
          <h2 className="text-[18px] font-bold text-black">{titulo}</h2>
        </div>
      )}

      {cabecalho && <div className="px-6 py-4">{cabecalho}</div>}

      {/* Badge status */}
      {!titulo && (
        <div
          className={`px-4 pb-2 ${variant !== "recebida" ? "pt-8" : "pt-2"}`}
        >
          <div
            className={`w-full text-center py-1.5 text-[13px] font-semibold flex items-center justify-center gap-1.5 rounded-lg ${badgeClass()}`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
            </svg>
            {badgeLabel()}
          </div>
        </div>
      )}

      <div className="px-6 pb-5">
        {/* Id */}
        <p className="text-[12px] text-[#6B7280] mb-0.5 pt-2">Id da Cautela:</p>
        <p className="text-[16px] font-bold text-black mb-4">{cautela.id}</p>

        {/* Data e Hora */}
        <div className="flex gap-8 mb-4">
          <div>
            <p className="text-[12px] text-[#6B7280] mb-0.5">
              Data da solicitação
            </p>
            <p className="text-[16px] font-bold text-black">
              {cautela.data?.split(", ")[0] ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#6B7280] mb-0.5">
              Hora da solicitação
            </p>
            <p className="text-[16px] font-bold text-black">
              {cautela.data?.split(", ")[1] ?? "—"}
            </p>
          </div>
        </div>

        {/* Setor */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Setor</p>
        <p className="text-[16px] font-bold text-black mb-4">
          {cautela.setorId || "-"}
        </p>

        {/* Proprietário */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Proprietário:</p>
        <p className="text-[16px] font-bold text-black mb-4">
          {cautela.visitante || "-"}
        </p>

        {/* Documento */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Documento/Matrícula</p>
        <p className="text-[16px] font-bold text-black mb-4">
          {cautela.documento || "-"}
        </p>

        {/* Email */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Email</p>
        <p className="text-[16px] font-bold text-black mb-4">
          {cautela.proprietarioEmail || "-"}
        </p>

        {/* Empresa */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Empresa</p>
        <p className="text-[16px] font-bold text-black mb-4">
          {cautela.empresa || "-"}
        </p>

        {/* Aprovado por — só no histórico */}
        {variant === "historico" && cautela.gestor && (
          <>
            <p className="text-[12px] text-[#6B7280] mb-0.5">Aprovado por</p>
            <p className="text-[16px] font-bold text-black mb-4">
              {cautela.gestor}
            </p>
          </>
        )}

        {/* Tabela cautelados */}
        <div className="rounded-lg overflow-hidden mb-5 border border-[#E5E7EB]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0E9F6E] text-white">
                <th className="px-4 py-2.5 text-left text-[18px] font-bold">
                  Descrição
                </th>
                <th className="px-4 py-2.5 text-right text-[18px] font-bold">
                  Quantidade
                </th>
              </tr>
            </thead>
            <tbody>
              {cautela.equipamentos.map((eq, i) => (
                <tr
                  key={i}
                  className={`border-t border-[#F3F4F6] ${i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"}`}
                >
                  <td className="px-4 py-3 text-[18px] text-[#111827]">
                    {eq.descricao}
                  </td>
                  <td className="px-4 py-3 text-[18px] text-[#111827] text-right">
                    {eq.quantidade ?? 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ações customizadas por papel */}
        {acoes && <div className="flex flex-col gap-3">{acoes}</div>}
      </div>
    </div>
  );
}
