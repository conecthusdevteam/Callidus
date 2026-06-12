import type { Cautela } from "../data/cautelaTypes";
import { BannerStatus, JustificativaBox } from "../components/BannerStatus";
import { TabelaCautelados } from "../components/TabelaCautelados";

export function DetalhesCautelaPortaria({
  cautela,
  onAprovarEntrada,
  onAprovarSaida,
}: {
  cautela: Cautela;
  onFechar: () => void;
  onAprovarEntrada?: () => void;
  onAprovarSaida?: () => void;
}) {
  const tipoPermissaoLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "Livre trânsito"
      : "Entrada única";
  const statusFinalizadoLabel =
    cautela.status === "Reprovado" ? "Reprovado" : "Aprovado";

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 pb-40">
        <div className="mb-4">
          <BannerStatus cautela={cautela} />
        </div>
        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <div className="mb-4">
            <JustificativaBox motivo={cautela.motivoNegativa} />
          </div>
        )}
        <div className="mb-3 bg-gray-200 rounded-sm p-2">
          <p className="text-[12px] font-normal text-[#737373]">
            Id da cautela
          </p>
          <p className="text-[14px] font-bold text-black break-all">
            {cautela.id}
          </p>
          {cautela.tipoPermissaoAlteradoEm && (
            <p className="text-sm font-semibold text-[#0A0A0A]">
              {tipoPermissaoLabel}
            </p>
          )}
        </div>
        <div className="mb-3">
          <p className="text-[12px] font-normal text-[#737373]">Proprietário</p>
          <p className="text-[24px] font-bold text-[#0A0A0A]">
            {cautela.visitante || "-"}
          </p>
        </div>
        <div className="flex gap-8 mb-3">
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">Documento</p>
            <p className="text-[16px] font-bold text-black">
              {cautela.documento || "-"}
            </p>
          </div>
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">Setor</p>
            <p className="text-[16px] font-bold text-black">
              {cautela.setorId || "-"}
            </p>
          </div>
        </div>
        {cautela.proprietarioEmail && (
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">
              E-mail do proprietário
            </p>
            <p className="text-[18px] font-bold text-black">
              {cautela.proprietarioEmail}
            </p>
          </div>
        )}
        <div className="mb-3">
          <p className="text-[12px] font-normal text-[#737373]">Empresa</p>
          <p className="text-[16px] font-bold text-black">
            {cautela.empresa || "-"}
          </p>
        </div>

        <div className="border-t border-[#B6B6B6] my-3" />

        {cautela.gestor && (
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">
              {statusFinalizadoLabel} por:
            </p>
            <p className="text-[16px] font-bold text-black">{cautela.gestor}</p>
          </div>
        )}
        <div className="flex gap-8 mb-3">
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">
              Data e hora da solicitação
            </p>
            <p className="text-[16px] font-bold text-black">
              {cautela.data || "-"}
            </p>
          </div>
          {cautela.aprovadoEm &&
            (cautela.status === "Aprovado" ||
              cautela.status === "Saída Autorizada" ||
              cautela.status === "Encerrada") && (
              <div className="mb-4">
                <p className="text-[12px] text-[#6B7280]">
                  Data e hora da aprovação
                </p>
                <p className="text-[16px] font-bold text-black">
                  {cautela.aprovadoEm}
                </p>
              </div>
            )}

          {cautela.reprovadoEm && cautela.status === "Reprovado" && (
            <div className="mb-4">
              <p className="text-[12px] text-[#6B7280]">
                Data e hora da reprovação
              </p>
              <p className="text-[16px] font-bold text-black">
                {cautela.reprovadoEm}
              </p>
            </div>
          )}
        </div>
        {cautela.entradaValidadaEm &&
          cautela.status === "Aprovado" &&
          cautela.etapaFluxo !== "APROVADA_PELO_GESTOR" && (
            <div className="mb-4">
              <p className="text-[12px] text-[#6B7280]">
                Data e hora da validação
              </p>
              <p className="text-[16px] font-bold text-black">
                {cautela.entradaValidadaEm}
              </p>
            </div>
          )}

        {(cautela.status === "Saída Autorizada" ||
          cautela.status === "Encerrada") && (
          <div className="flex gap-8 mb-4">
            {cautela.entradaValidadaEm && (
              <div>
                <p className="text-[12px] text-[#6B7280]">
                  Data e hora da validação
                </p>
                <p className="text-[16px] font-bold text-black">
                  {cautela.entradaValidadaEm}
                </p>
              </div>
            )}
            {cautela.saidaAutorizadaEm && (
              <div>
                <p className="text-[12px] text-[#6B7280]">
                  Data e hora da saída autorizada
                </p>
                <p className="text-[16px] font-bold text-black">
                  {cautela.saidaAutorizadaEm}
                </p>
              </div>
            )}
          </div>
        )}

        {cautela.status === "Encerrada" && cautela.encerradaEm && (
          <div className="mb-4">
            <p className="text-[12px] text-[#6B7280]">
              Data e hora do encerramento
            </p>
            <p className="text-[16px] font-bold text-black">
              {cautela.encerradaEm}
            </p>
          </div>
        )}
        {cautela.validade && (
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">
              Válido até:
            </p>
            <p className="text-sm text-gray-700">{cautela.validade}</p>
          </div>
        )}
        {cautela.status === "Encerrada" && cautela.encerradaEm && (
          <div className="mb-3">
            <p className="text-[12px] font-normal text-[#737373]">
              Data e hora de saída:
            </p>
            <p className="text-sm text-gray-700">{cautela.encerradaEm}</p>
          </div>
        )}
        <div className="mb-3">
          <TabelaCautelados equipamentos={cautela.equipamentos ?? []} />
        </div>
      </div>

      <div className="fixed bottom-[70px] left-0 right-0 flex flex-col gap-2 px-4 pb-3 pt-3 bg-white border-t border-gray-200">
        {cautela.status === "Aprovado" && onAprovarEntrada && (
          <button
            onClick={onAprovarEntrada}
            className="w-full py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold"
          >
            Aprovar entrada
          </button>
        )}
        {cautela.status === "Saída Autorizada" && onAprovarSaida && (
          <button
            onClick={onAprovarSaida}
            className="w-full py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold"
          >
            Aprovar saída
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="w-full py-2 text-[#737373] bg-[#F5F5F5] text-sm font-medium rounded-lg"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
