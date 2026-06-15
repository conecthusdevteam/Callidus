import type { Cautela } from "../data/cautelaTypes";

export function BannerStatus({ cautela }: { cautela: Cautela }) {
  const { status } = cautela;

  if (status === "Saída Autorizada") {
    return (
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
    );
  }

  if (status === "Aprovado" && cautela.etapaFluxo === "APROVADA_PELO_GESTOR") {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#BCF0DA] border border-[#31C48D] text-[#065F46] text-[13px] font-medium">
        Em Validação {cautela.aprovadoEm ? `desde ${cautela.aprovadoEm}` : ""}
      </div>
    );
  }

  if (status === "Aprovado") {
    return (
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
        Ativa{" "}
        {cautela.entradaValidadaEm ? `desde ${cautela.entradaValidadaEm}` : ""}
      </div>
    );
  }

  if (status === "Reprovado") {
    return (
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
    );
  }

  if (status === "Encerrada") {
    return (
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
    );
  }

  if (status === "Em validação") {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[13px] font-medium">
        Em Validação {cautela.aprovadoEm ? `desde ${cautela.aprovadoEm}` : ""}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[13px] font-medium">
      Em Aprovação
    </div>
  );
}

export function BannerAguardandoSaida() {
  return (
    <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-[18px] font-medium">
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      Aguardando saída
    </div>
  );
}

// ─── JustificativaBox ─────────────────────────────────────────────────────────

export function JustificativaBox({ motivo }: { motivo: string }) {
  return (
    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
      <p className="text-sm font-semibold text-red-700 mb-1">Justificativa:</p>
      <p className="text-sm text-red-700">{motivo}</p>
    </div>
  );
}
