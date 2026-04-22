import type { StatusCautela } from "../data/mockData";

interface Props {
  status: StatusCautela;
}

const config: Record<
  StatusCautela,
  { label: string; className: string; dot: string }
> = {
  Aprovado: {
    label: "Aprovado",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  Reprovado: {
    label: "Reprovado",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  "Em análise": {
    label: "Em análise",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
};

export default function StatusBadge({ status }: Props) {
  const { label, className, dot } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
