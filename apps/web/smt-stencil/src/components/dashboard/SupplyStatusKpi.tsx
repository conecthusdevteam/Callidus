import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/data/mockWashes";

/**
 * KPI card "Fornecimento de dados" (substitui o card lateral antigo).
 * Mostra SGS e CLP lado a lado, com pill verde/vermelho conforme status.
 * Borda esquerda roxa (--status-accent), seguindo o padrão dos outros KPIs.
 */
export function SupplyStatusKpi({ status }: { status: SystemStatus }) {
  const items = [
    { label: "SGS", ok: status.scs.ok, mins: status.scs.lastSyncMin },
    { label: "CLP", ok: status.clp.ok, mins: status.clp.lastSyncMin },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border-[0.5px] border-kpi-border border-l-4 bg-kpi-default-bg",
        "px-4 pt-4 pb-4 transition-shadow hover:shadow-card",
      )}
      style={{ borderLeftColor: "hsl(var(--status-accent))" }}
    >
      <p className="kpi-label">Fornecimento de dados</p>
      <div className="mt-2 flex items-center gap-2">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md px-2 py-1",
              it.ok ? "bg-badge-ok-bg text-badge-ok-fg" : "bg-badge-danger-bg text-badge-danger-fg",
            )}
          >
            <span className="text-base font-bold tabular">{it.label}</span>
            {it.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="ml-auto text-xs font-medium">
              {`há ${it.mins} min${it.mins === 1 ? "" : "s"}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
