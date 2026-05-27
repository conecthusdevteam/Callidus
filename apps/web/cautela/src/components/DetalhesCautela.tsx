import type { Cautela } from "../data/cautelaTypes";

interface DetalhesCautelaProps {
  cautela: Cautela;
  onFechar: () => void;
  acoes?: React.ReactNode;
  variant?: "recebida" | "historico";
  titulo?: string;
  cabecalho?: React.ReactNode;
  mostrarAcompanhamento?: boolean;
  ocultarBanner?: boolean;
}

export default function DetalhesCautela({
  cautela,
  onFechar,
  acoes,
  variant = "recebida",
  titulo,
  cabecalho,
  mostrarAcompanhamento = false,
  ocultarBanner = false,
}: DetalhesCautelaProps) {
  const bannerLabel =
    cautela.status === "Saída Autorizada"
      ? "Autorizado a sair"
      : "Autorizado a entrar";

  const bannerClass =
    cautela.status === "Saída Autorizada"
      ? "bg-[#FCE96A] text-[#171717]"
      : cautela.status === "Aprovado"
        ? "bg-[#D1FAE5] text-[#171717]"
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

  const statusFinalizadoLabel =
    cautela.status === "Reprovado" ? "Reprovado" : "Aprovado";
  const statusFinalizadoEm =
    cautela.status === "Reprovado" ? cautela.reprovadoEm : cautela.aprovadoEm;
  const permissaoEditadaLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "LIVRE TRÂNSITO"
      : "ENTRADA ÚNICA";

  const progresso = [
    {
      label: "Pedido realizado",
      data: cautela.data?.split(", ")[1],
      complete: true,
    },
    {
      label:
        cautela.status === "Reprovado"
          ? "Cautela reprovada"
          : "Cautela aprovada",
      data:
        cautela.status === "Reprovado"
          ? cautela.reprovadoEm
          : cautela.aprovadoEm,
      complete:
        cautela.status !== "Em análise" || cautela.etapaFluxo !== "SOLICITADA",
    },
    {
      label:
        cautela.status === "Encerrada"
          ? "Saída autorizada"
          : "Validação da portaria",
      data: cautela.entradaValidadaEm,
      complete:
        cautela.status === "Aprovado" ||
        cautela.status === "Saída Autorizada" ||
        cautela.status === "Encerrada",
    },
  ];

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

      {!ocultarBanner &&
        (variant === "recebida" ||
          cautela.status === "Saída Autorizada" ||
          cautela.status === "Aprovado") &&
        !titulo && (
          <div className="px-4 pt-8 pb-0">
            <div
              className={`w-full text-center py-1 text-[13px] font-bold rounded-lg ${bannerClass}`}
            >
              {bannerLabel}
            </div>
          </div>
        )}

      {titulo && (
        <div className="px-5 pt-4 pb-2 text-center">
          <h2 className="text-[16px] font-bold text-black">{titulo}</h2>
        </div>
      )}

      {cabecalho && <div className="px-5 py-3">{cabecalho}</div>}

      {/* Badge status */}
      {!titulo && (
        <div
          className={`px-4 pb-2 pt-8 ${
            cautela.status === "Saída Autorizada" ||
            cautela.status === "Aprovado" ||
            variant === "recebida"
              ? "pt-1"
              : "pt-8"
          }`}
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
          {cautela.status === "Reprovado" && cautela.motivoNegativa && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left">
              <p className="text-[13px] font-bold text-red-700">
                Justificativa:
              </p>
              <p className="mt-1 text-[13px] text-red-700">
                {cautela.motivoNegativa}
              </p>
            </div>
          )}
          {cautela.tipoPermissaoAlteradoEm && (
            <>
              <div className="mt-2 text-center text-[13px] text-[#6B7280]">
                Acesso da cautela editado para{" "}
                <span className="font-bold">{permissaoEditadaLabel}</span> em{" "}
                {cautela.tipoPermissaoAlteradoEm}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-5 pb-4">
        {/* Id */}
        <p className="text-[12px] text-[#6B7280] mb-0.5 pt-2">Id da Cautela:</p>
        <p className="text-[14px] font-bold text-black mb-3">{cautela.id}</p>

        {/* Data e Hora */}
        <div className="flex gap-8 mb-3">
          <div>
            <p className="text-[12px] text-[#6B7280] mb-0.5">
              Data da solicitação
            </p>
            <p className="text-[14px] font-bold text-black">
              {cautela.data?.split(", ")[0] ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#6B7280] mb-0.5">
              Hora da solicitação
            </p>
            <p className="text-[14px] font-bold text-black">
              {cautela.data?.split(", ")[1] ?? "—"}
            </p>
          </div>
        </div>

        {/* Setor */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Setor</p>
        <p className="text-[14px] font-bold text-black mb-3">
          {cautela.setorId || "-"}
        </p>

        {mostrarAcompanhamento && (
          <div className="float-right ml-5 mb-5 w-[160px]">
            <p className="text-[12px] font-bold text-[#404040] mb-4">
              Acompanhe seu pedido de cautela
            </p>
            <div className="space-y-0">
              {progresso.map((item, index) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[1fr_18px_auto] gap-2"
                >
                  <p
                    className={`text-[11px] leading-tight ${
                      item.complete ? "text-black" : "text-[#BDBDBD]"
                    }`}
                  >
                    {item.label}
                  </p>
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-4 w-4 rounded-full ${
                        item.complete ? "bg-[#3BB14A]" : "bg-[#BDBDBD]"
                      }`}
                    />
                    {index < progresso.length - 1 && (
                      <span
                        className={`h-20 w-0.5 ${
                          progresso[index + 1].complete
                            ? "bg-[#3BB14A]"
                            : "bg-[#BDBDBD]"
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-[12px] text-[#404040]">
                    {item.data?.split(", ")[1] ?? item.data ?? ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proprietário */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Proprietário:</p>
        <p className="text-[14px] font-bold text-black mb-3">
          {cautela.visitante || "-"}
        </p>

        {/* Documento */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Documento/Matrícula</p>
        <p className="text-[14px] font-bold text-black mb-3">
          {cautela.documento || "-"}
        </p>

        {/* Email */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Email</p>
        <p className="text-[14px] font-bold text-black mb-3">
          {cautela.proprietarioEmail || "-"}
        </p>

        {/* Empresa */}
        <p className="text-[12px] text-[#6B7280] mb-0.5">Empresa</p>
        <p className="text-[14px] font-bold text-black mb-3">
          {cautela.empresa || "-"}
        </p>

        {/* Aprovado por — só no histórico */}
        {variant === "historico" && cautela.gestor && (
          <>
            <p className="text-[12px] text-[#6B7280] mb-0.5">
              {statusFinalizadoLabel} por
            </p>
            <p className="text-[14px] font-bold text-black mb-3">
              {cautela.gestor}
            </p>
            {statusFinalizadoEm && (
              <>
                <p className="text-[12px] text-[#6B7280] mb-0.5">
                  {statusFinalizadoLabel} em
                </p>
                <p className="text-[14px] font-bold text-black mb-3">
                  {statusFinalizadoEm}
                </p>
              </>
            )}
          </>
        )}

        {/* Tabela cautelados */}
        <div className="rounded-md overflow-hidden mb-4 border border-[#E5E7EB]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0E9F6E] text-white">
                <th className="px-3 py-2 text-left text-[18px] font-bold">
                  Descrição
                </th>
                <th className="px-3 py-2 text-right text-[18px] font-bold">
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
                  <td className="px-3 py-2 text-[18px] text-[#111827]">
                    {eq.descricao}
                  </td>
                  <td className="px-3 py-2 text-[18px] text-[#111827] text-right">
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
