import type { StatusCautela } from "../data/cautelaTypes";

// ─── Badges individuais ───────────────────────────────────────────────────────

export function BadgeAnalise() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium bg-[#FCE96A] text-[#111827] border border-[#FACA15]">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path d="M12 8v5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      Em análise
    </span>
  );
}

export function BadgeAtencao() {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-100 text-amber-800 border border-amber-400">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Atenção
      </span>
      <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-400 text-amber-900">
        Ação necessária
      </span>
    </div>
  );
}

export function BadgeAprovado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#BCF0DA] text-[#065F46] border border-[#31C48D]">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Aprovado
    </span>
  );
}

export function BadgeReprovado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#FBD5D5] text-[#9B1C1C] border border-[#F05252]">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Reprovado
    </span>
  );
}

export function BadgeEncerrada() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#F4F4F4] text-[#525252] border border-[#A3A3A3]">
      <svg
        className="w-3.5 h-3.5"
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
    </span>
  );
}

// ─── Seletor de Badge por status ──────────────────────────────────────────────

export function BadgeStatus({ status }: { status: StatusCautela }) {
  if (status === "Saída Autorizada") return <BadgeAprovado />;
  if (status === "Aprovado") return <BadgeAprovado />;
  if (status === "Reprovado") return <BadgeReprovado />;
  if (status === "Encerrada") return <BadgeEncerrada />;
  return <BadgeAnalise />;
}
