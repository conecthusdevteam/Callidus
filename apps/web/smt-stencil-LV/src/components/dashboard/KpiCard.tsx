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
  // Escolhe o background conforme a variante
  const bg =
    variant === "primary"   ? "bg-kpi-primary-bg"
    : variant === "attention" ? "bg-kpi-attention-bg"
    : "bg-kpi-default-bg";

  // Escolhe a cor da borda esquerda (4px colorida) conforme a variante
  const leftBorder =
    variant === "primary"   ? "border-l-kpi-primary-border"
    : variant === "attention" ? "border-l-kpi-attention-border"
    : "border-l-kpi-border";

  return (
    <div
  className={cn(
    "rounded-lg border-[0.5px] border-kpi-border border-l-4 transition-shadow hover:shadow-card",
    "px-4 pt-4 pb-4", // espaçamento: 16px superior, 16px inferior, 16px laterais
    bg,
    leftBorder,
    className,
  )}
>
  <p className="kpi-label">{label}</p>
  {/* gap de 8px entre label e valor (mt-2 = 0.5rem = 8px) */}
  <p
    className={cn(
      "kpi-value mt-2 text-right",
      variant === "attention" && "text-kpi-attention-fg",
    )}
  >
    {value}
  </p>
</div>

  );
}
