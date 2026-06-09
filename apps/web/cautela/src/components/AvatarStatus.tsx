import vector from "../assets/Vector.svg";
// ─── Avatares por status ──────────────────────────────────────────────────────

export function AvatarAnalise() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#FCE96A] flex items-center justify-center flex-shrink-0">
      <img src={vector} alt="Dashboard" className="h-6 w-6" />
    </div>
  );
}

export function AvatarAtencao() {
  return (
    <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-amber-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    </div>
  );
}

export function AvatarAprovado() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#D1FAE5] border border-[#31C48D] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#2B8E37]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

export function AvatarReprovado() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#FEE2E2] border border-[#F05252] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#E02424]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

export function AvatarEncerrada() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#F4F4F4] border border-[#A3A3A3] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#525252]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

// ─── Seletor de Avatar por status ─────────────────────────────────────────────

import type { StatusCautela } from "../data/cautelaTypes";

export function AvatarStatus({ status }: { status: StatusCautela }) {
  if (status === "Saída Autorizada") return <AvatarAprovado />;
  if (status === "Aprovado") return <AvatarAprovado />;
  if (status === "Reprovado") return <AvatarReprovado />;
  if (status === "Encerrada") return <AvatarEncerrada />;
  return <AvatarAnalise />;
}
