import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: React.ReactNode;
  value: string | number;
  variant?: "default" | "primary" | "neutral" | "attention";
  className?: string;
}

export function KpiCard({
  label,
  value,
  variant = "default",
  className,
}: KpiCardProps) {
  const bg =
    variant === "primary"
      ? "bg-kpi-primary-bg"
      : variant === "attention"
        ? "bg-kpi-attention-bg"
        : "bg-kpi-default-bg";

  const leftBorder =
    variant === "primary"
      ? "border-l-kpi-primary-border"
      : variant === "attention"
        ? "border-l-kpi-attention-border"
        : "border-l-kpi-border";

  return (
    <div
      className={cn(
        "w-full rounded-lg border-[0.5px] border-kpi-border border-l-4",
        "flex flex-col justify-between",
        "min-h-[122px] px-4 py-5",
        bg,
        leftBorder,
        className,
      )}
    >
      <p className="kpi-label">{label}</p>
      <p
        className={cn(
          "kpi-value",
          variant === "attention" && "text-kpi-attention-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
