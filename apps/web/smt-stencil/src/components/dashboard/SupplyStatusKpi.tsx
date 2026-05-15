import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/data/mockWashes";

export function SupplyStatusKpi({ status }: { status: SystemStatus }) {
  const items = [
    { label: "SGS", ok: status.sgs.ok, mins: status.sgs.lastSyncMin },
    { label: "CLP", ok: status.clp.ok, mins: status.clp.lastSyncMin },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border-[0.5px] border-kpi-border border-l-4 w-[300px]",
        "flex flex-col justify-between",
        "px-4 py-3 min-h-[130px]",
      )}
      style={{ borderLeftColor: "hsl(var(--status-accent))" }}
    >
      <p className="kpi-label">Fornecimento de dados</p>

      {/* SGS e CLP lado a lado */}
      <div className="mt-1 flex items-center gap-3">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-md px-2 py-2",
              !it.ok &&
                "border border-badge-danger-fg/30 bg-badge-danger-bg/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-foreground">
                {it.label}
              </span>
              {it.ok ? (
                <CheckCircle2 className="h-4 w-4 text-badge-ok-fg" />
              ) : (
                <XCircle className="h-4 w-4 text-badge-danger-fg" />
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {it.mins < 0
                ? "sem dados"
                : `há ${it.mins} minuto${it.mins === 1 ? "" : "s"}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
