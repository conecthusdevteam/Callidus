import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "neutral" | "attention";
  className?: string;
}

/**
 * Card de KPI grande, legível a 1,5m de distância.
 * RP-01: total do dia, total stencil, total placas, última sincronização.
 * Borda lateral colorida à esquerda identifica o tipo do KPI.
 */
export function KpiCard({ label, value, variant = "default", className }: KpiCardProps) {
  const accent =
    variant === "primary"
      ? "border-l-primary"
      : variant === "attention"
        ? "border-l-kpi-attention-fg"
        : variant === "neutral"
          ? "border-l-kpi-neutral"
          : "border-l-border";

  return (
    <div
      className={cn(
        "relative rounded-xl border border-l-[6px] bg-card p-5 shadow-card transition-shadow hover:shadow-elevated",
        accent,
        variant === "attention" && "bg-kpi-attention-bg",
        className,
      )}
    >
      <p className="kpi-label">{label}</p>
      <p
        className={cn(
          "kpi-value mt-2 text-right md:text-6xl",
          variant === "attention" && "text-kpi-attention-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
