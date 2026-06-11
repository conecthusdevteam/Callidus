import { type Cautela } from "../data/cautelaTypes";
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
  livreAcesso,
  onTipoAcessoChange, // ← novo
}: {
  cautela: CautelaComDecisao;
  onAutorizarSaida?: () => void;
  livreAcesso?: "livre" | "entrada";
  onLivreAcessoChange?: (v: "livre" | "entrada") => void;
  onAprovar?: () => void;
  onDescartar?: () => void;
  onTipoAcessoChange?: (v: "livre" | "entrada") => void; // ← novo
}) {
  const isEmValidacao =
    cautela.status === "Em validação" ||
    (cautela.status === "Aprovado" &&
      cautela.etapaFluxo === "APROVADA_PELO_GESTOR");

  const getCautelaBg = () => {
    if (isEmValidacao) return "bg-[#FCE96A4D]";

    switch (cautela.status) {
      case "Aprovado":
        return "bg-[#BCF0DA4D]";

      case "Reprovado":
        return "bg-[#FBD5D54D]";

      case "Saída Autorizada":
        return "bg-amber-100"; // ajuste para a cor do BannerAguardandoSaida

      case "Encerrada":
        return "bg-[#E5E7EB]";

      case "Em análise":
        return "bg-[#FCE96A4D]";

      default:
        return "bg-[#F9FAFB]";
    }
  };

  const renderBanner = () => {
    if (isEmValidacao) {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[18px] font-medium mb-4">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
          </svg>
          Em validação
        </div>
      );
    }
    if (cautela.status === "Aprovado") {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#BCF0DA] border border-[#31C48D] text-[#065F46] text-[18px] font-medium mb-4">
          <svg
            className="w-5 h-5 flex-shrink-0"
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
          Ativa
        </div>
      );
    }
    if (cautela.status === "Reprovado") {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FBD5D5] border border-[#F05252] text-[#9B1C1C] text-[18px] font-medium mb-4">
          <svg
            className="w-5 h-5 flex-shrink-0"
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
          Reprovado
        </div>
      );
    }
    if (cautela.status === "Saída Autorizada") {
      return (
        <div className="mb-4">
          <BannerAguardandoSaida />
        </div>
      );
    }
    if (cautela.status === "Encerrada") {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#D1D5DB] border border-[#A3A3A3] text-[#525252] text-[18px] font-medium mb-4">
          <svg
            className="w-5 h-5 flex-shrink-0"
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
          Encerrada
        </div>
      );
    }

    if (cautela.status === "Em análise") {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[18px] font-medium mb-2">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
          </svg>
          Em Aprovação
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {renderBanner()}

      {cautela.motivoNegativa && (
        <div className="mb-4">
          <JustificativaBox motivo={cautela.motivoNegativa} />
        </div>
      )}

      {/* Id */}
      <div className={`mb-3 rounded-lg px-4 py-3 ${getCautelaBg()}`}>
        <p className="text-[12px] text-[#737373]">Id da Cautela:</p>
        <p className="text-[14px] font-bold text-black">{cautela.id}</p>

        {cautela.tipoPermissao && (
          <p className="text-[14px] font-bold text-black mt-1">
            {cautela.tipoPermissao === "LIVRE_TRANSITO"
              ? "Livre acesso"
              : "Entrada única"}
          </p>
        )}
      </div>

      {/* Proprietário */}
      <div className="mb-3">
        <p className="text-[12px] text-[#6B7280]">Proprietário:</p>
        <p className="text-[24px] font-bold text-black">
          {cautela.visitante || "-"}
        </p>
      </div>

      <div className="flex gap-8 mb-3">
        {/* Documento */}
        <div className="mb-3">
          <p className="text-[12px] text-[#6B7280]">Documento/Matrícula</p>
          <p className="text-[16px] font-bold text-black">
            {cautela.documento || "-"}
          </p>
        </div>

        {/* Setor */}
        <div className="mb-3">
          <p className="text-[12px] text-[#6B7280]">Setor</p>
          <p className="text-[16px] font-bold text-black">
            {cautela.setorId || "-"}
          </p>
        </div>
      </div>

      {/* Email */}
      <div className="mb-3">
        <p className="text-[12px] text-[#6B7280]">Email</p>
        <p className="text-[18px] font-bold text-black">
          {cautela.proprietarioEmail || "-"}
        </p>
      </div>

      {/* Empresa */}
      <div className="mb-3">
        <p className="text-[12px] text-[#6B7280]">Empresa</p>
        <p className="text-[16px] font-bold text-black">
          {cautela.empresa || "-"}
        </p>
      </div>

      <div className="border-t border-[#B6B6B6] my-3" />

      {/* Aprovador */}
      {cautela.gestor && (
        <div className="mb-3">
          <p className="text-[12px] text-[#6B7280]">Aprovador:</p>
          <p className="text-[16px] font-bold text-black">{cautela.gestor}</p>
        </div>
      )}

      {/* Data */}
      <div className="mb-4">
        <p className="text-[12px] text-[#6B7280]">Data e hora da solicitação</p>
        <p className="text-[16px] font-bold text-black">
          {cautela.data || "-"}
        </p>
      </div>

      {/* Validade */}
      {cautela.validade && (
        <div className="mb-4">
          <p className="text-[12px] text-[#6B7280]">Válido até:</p>
          <p className="text-[14px] font-bold text-black">{cautela.validade}</p>
        </div>
      )}

      {/* Data de saída */}
      {cautela.status === "Encerrada" && cautela.encerradaEm && (
        <div className="mb-3">
          <p className="text-[12px] text-[#6B7280]">Data e hora de saída:</p>
          <p className="text-[14px] font-bold text-black">
            {cautela.encerradaEm}
          </p>
        </div>
      )}

      {/* Tabela */}
      <div className="mt-4 mb-4">
        <TabelaCautelados equipamentos={cautela.equipamentos} />
      </div>

      {/* Livre acesso + botões — só quando Em análise */}
      {cautela.status !== "Em análise" &&
        cautela.status !== "Reprovado" &&
        cautela.status !== "Encerrada" &&
        onTipoAcessoChange && (
          <div className="mt-4">
            <p className="text-[13px] text-[#404040] mb-2">
              Esta cautela tem livre acesso?
            </p>
            <div className="flex gap-8">
              <label className="flex items-center gap-2 text-[14px] text-[#404040] cursor-pointer">
                <input
                  type="checkbox"
                  checked={livreAcesso === "livre"}
                  onChange={() => onTipoAcessoChange("livre")}
                  className="w-4 h-4 rounded accent-black"
                />
                Sim
              </label>
              <label className="flex items-center gap-2 text-[14px] text-[#404040] cursor-pointer">
                <input
                  type="checkbox"
                  checked={livreAcesso === "entrada"}
                  onChange={() => onTipoAcessoChange("entrada")}
                  className="w-4 h-4 rounded accent-black"
                />
                Não
              </label>
            </div>
          </div>
        )}

      {/* Botão autorizar saída */}
      {cautela.status === "Aprovado" &&
        cautela.etapaFluxo !== "APROVADA_PELO_GESTOR" &&
        cautela.decisaoLocal === undefined &&
        onAutorizarSaida && (
          <button
            onClick={onAutorizarSaida}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#0A0A0A] text-white text-sm font-semibold hover:bg-white transition-colors"
          >
            Autorizar saída
          </button>
        )}
    </div>
  );
}
