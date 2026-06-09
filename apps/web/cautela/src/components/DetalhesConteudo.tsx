import { type Cautela, type StatusCautela } from "../data/cautelaTypes";
import StatusBadge from "../components/StatusBadge";
import {
  BannerAguardandoSaida,
  JustificativaBox,
} from "../components/BannerStatus";
import { TabelaCautelados } from "../components/TabelaCautelados";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
  livreAcesso?: "livre" | "entrada";
}

export function DetalhesConteudo({
  cautela,
  onAutorizarSaida,
}: {
  cautela: CautelaComDecisao;
  onAutorizarSaida?: () => void;
}) {
  const tipoPermissaoLabel =
    cautela.tipoPermissao === "LIVRE_TRANSITO"
      ? "Livre trânsito"
      : "Entrada única";
  const statusExibido =
    cautela.decisaoLocal === "aprovado"
      ? "Aprovado"
      : cautela.decisaoLocal === "reprovado"
        ? "Reprovado"
        : cautela.status;

  const isSomenteLeitura =
    cautela.decisaoLocal !== undefined ||
    cautela.status === "Aprovado" ||
    cautela.status === "Reprovado" ||
    cautela.status === "Saída Autorizada" ||
    cautela.status === "Encerrada";

  return (
    <div>
      {isSomenteLeitura && (
        <div className="mb-4">
          {cautela.status !== "Saída Autorizada" &&
            cautela.status !== "Encerrada" &&
            cautela.status !== "Aprovado" &&
            cautela.status !== "Reprovado" && (
              <StatusBadge status={statusExibido as StatusCautela} fullWidth />
            )}
          {cautela.status === "Aprovado" && (
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
          )}
          {cautela.status === "Saída Autorizada" && (
            <div className="mt-2">
              <BannerAguardandoSaida />
            </div>
          )}
          {cautela.status === "Reprovado" && (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FBD5D5] border border-[#F05252] text-[#9B1C1C] text-[13px] font-medium">
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Reprovado {cautela.reprovadoEm ? `em ${cautela.reprovadoEm}` : ""}
            </div>
          )}
          {cautela.status === "Encerrada" && (
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
          )}
          {(cautela.motivoNegativa || cautela.decisaoLocal === "reprovado") && (
            <div className="mt-3">
              <JustificativaBox motivo={cautela.motivoNegativa ?? "—"} />
            </div>
          )}
          {cautela.tipoPermissaoAlteradoEm && (
            <p className="mt-2 text-center text-sm font-semibold text-[#404040]">
              {tipoPermissaoLabel}
            </p>
          )}
        </div>
      )}
      <div className="float-right ml-5 mb-5 w-[160px]">
        <p className="mb-4 text-[12px] font-bold text-[#404040]">
          Acompanhe seu pedido de cautela
        </p>
        <div></div>
      </div>

      <div className="mb-4">
        <p className="text-base font-bold text-black">Id da cautela</p>
        <p className="text-base text-black">{cautela.id}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Setor</p>
        <p className="text-base text-black">{cautela.setorId || "-"}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">
          Data e hora da solicitação
        </p>
        <p className="text-base text-black">{cautela.data}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">Proprietário</p>
        <p className="text-base text-black">{cautela.visitante}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Documento</p>
        <p className="text-base text-gray-700">{cautela.documento || "-"}</p>
      </div>
      <div className="mb-3">
        <p className="text-base font-bold text-black">Empresa</p>
        <p className="text-base text-gray-700">{cautela.empresa || "-"}</p>
      </div>
      <div className="mb-4">
        <p className="text-base font-bold text-black">E-mail do proprietário</p>
        <p className="text-base text-black">{cautela.proprietarioEmail}</p>
      </div>
      {cautela.validade && (
        <div className="mb-4">
          <p className="text-base font-bold text-black">Válido até:</p>
          <p className="text-base text-gray-700">{cautela.validade}</p>
        </div>
      )}
      {cautela.aprovadoEm && (
        <div className="mb-4">
          <p className="text-base font-bold text-black">Aprovado em:</p>
          <p className="text-base text-gray-700">{cautela.aprovadoEm}</p>
        </div>
      )}
      {cautela.status === "Encerrada" && cautela.encerradaEm && (
        <div className="mb-3">
          <p className="text-base font-bold text-black">
            Data e hora de saída:
          </p>
          <p className="text-base text-gray-700">{cautela.encerradaEm}</p>
        </div>
      )}

      <div className="mt-16 mb-2">
        <TabelaCautelados equipamentos={cautela.equipamentos} />
      </div>

      {cautela.status === "Aprovado" &&
        cautela.decisaoLocal === undefined &&
        onAutorizarSaida && (
          <button
            onClick={onAutorizarSaida}
            className="w-full mt-12 py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Autorizar saída
          </button>
        )}
    </div>
  );
}
