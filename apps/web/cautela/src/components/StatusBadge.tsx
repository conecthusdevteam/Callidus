import type { StatusCautela } from "../data/cautelaTypes";

export function IconSuccess() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.5 10.5C8.26142 10.5 10.5 8.26142 10.5 5.5C10.5 2.73858 8.26142 0.5 5.5 0.5C2.73858 0.5 0.5 2.73858 0.5 5.5C0.5 8.26142 2.73858 10.5 5.5 10.5Z"
        stroke="#2B8E37"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg
      width="4"
      height="3"
      viewBox="0 0 4 3"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.5 1.5L1.5 2.5L3.5 0.5"
        stroke="#2B8E37"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ícones Reprovado
export function IconCircleRed() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="6"
        cy="6"
        r="5"
        fill="#FBD5D5"
        stroke="#B91C1C"
        strokeWidth="1"
      />
      <path
        d="M4.5 4.5L7.5 7.5M7.5 4.5L4.5 7.5"
        stroke="#B91C1C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconX1() {
  return (
    <svg
      width="4"
      height="4"
      viewBox="0 0 4 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.5 0.5L3.5 3.5"
        stroke="#DB0101"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconX2() {
  return (
    <svg
      width="5"
      height="5"
      viewBox="0 0 5 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.66675 0.666626L0.666748 3.66663"
        stroke="#DB0101"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// IconAnalise.tsx
export function IconAnalise() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 5.375C10 2.82068 7.92932 0.75 5.375 0.75C2.82068 0.75 0.75 2.82068 0.75 5.375C0.75 7.92932 2.82068 10 5.375 10C7.92932 10 10 7.92932 10 5.375ZM10.75 5.375C10.75 8.34353 8.34353 10.75 5.375 10.75C2.40647 10.75 0 8.34353 0 5.375C0 2.40647 2.40647 0 5.375 0C8.34353 0 10.75 2.40647 10.75 5.375Z"
        fill="black"
      />
      <path
        d="M5 5.375V3.375C5 3.16789 5.16789 3 5.375 3C5.58211 3 5.75 3.16789 5.75 3.375V5.375C5.75 5.58211 5.58211 5.75 5.375 5.75C5.16789 5.75 5 5.58211 5 5.375Z"
        fill="black"
      />
      <path
        d="M5.37988 7C5.58699 7 5.75488 7.16789 5.75488 7.375C5.75488 7.58211 5.58699 7.75 5.37988 7.75H5.375C5.16789 7.75 5 7.58211 5 7.375C5 7.16789 5.16789 7 5.375 7H5.37988Z"
        fill="black"
      />
    </svg>
  );
}

export function IconSaida() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 2H2C1.44772 2 1 2.44772 1 3V9C1 9.55228 1.44772 10 2 10H8C8.55228 10 9 9.55228 9 9V7"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M6 1H10M10 1V5M10 1L5 6"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEncerrada() {
  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="5"
        width="8"
        height="5.5"
        rx="1.5"
        stroke="#525252"
        strokeWidth="1.2"
      />
      <path
        d="M3 5V3.5C3 2.39543 3.89543 1.5 5 1.5C6.10457 1.5 7 2.39543 7 3.5V5"
        stroke="#525252"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
interface Props {
  status: StatusCautela;
  fullWidth?: boolean;
}

const config: Record<StatusCautela, { label: string; className: string }> = {
  Aprovado: {
    label: "Aprovado",
    className: "bg-[#BCF0DA] text-[#171717] border border-[#31C48D]",
  },
  Reprovado: {
    label: "Reprovado",
    className: "bg-[#FBD5D5] text-[#171717] border border-[#F05252]",
  },
  "Em análise": {
    label: "Em análise",
    className: "bg-amber-50 text-[#171717] border border-amber-200",
  },
  "Saída Autorizada": {
    label: "Atenção – Ação necessária",
    className: "bg-amber-100 text-[#92400E] border border-amber-400",
  },
  Encerrada: {
    label: "Encerrada",
    className: "bg-[#F4F4F4] text-[#525252] border border-[#A3A3A3]",
  },
};

export default function StatusBadge({ status, fullWidth = false }: Props) {
  const { label, className } = config[status];

  const widthClass = fullWidth
    ? "w-full h-[36px]"
    : status === "Saída Autorizada"
      ? "min-w-[180px] h-[28px] px-3"
      : "w-[114px] h-[28px]";

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[14px] font-medium leading-[100%] ${widthClass} ${className}`}
    >
      {status === "Aprovado" && (
        <span className="relative flex items-center justify-center w-4 h-4">
          <IconSuccess />
          <span className="absolute">
            <IconCheck />
          </span>
        </span>
      )}
      {status === "Reprovado" && (
        <span className="relative flex items-center justify-center w-4 h-4">
          <IconCircleRed />
          <span className="absolute inset-0 flex items-center justify-center">
            <div className="absolute">
              <IconX1 />
            </div>
            <div className="absolute">
              <IconX2 />
            </div>
          </span>
        </span>
      )}
      {status === "Em análise" && (
        <span className="flex items-center justify-center w-4 h-4">
          <IconAnalise />
        </span>
      )}
      {status === "Saída Autorizada" && (
        <span className="flex items-center justify-center w-4 h-4">
          <IconSaida />
        </span>
      )}
      {status === "Encerrada" && (
        <span className="flex items-center justify-center w-4 h-4">
          <IconEncerrada />
        </span>
      )}

      {label}
    </span>
  );
}
