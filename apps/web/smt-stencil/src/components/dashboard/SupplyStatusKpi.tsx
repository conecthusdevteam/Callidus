import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/data/mockWashes";

/**
 * KPI card "Fornecimento de dados".
 * Layout conforme referência: SGS e CLP em texto bold ao lado de um ícone
 * circular (✓ verde / ✗ vermelho), com "há X minutos" abaixo de cada um.
 * Quando o sistema está fora do ar, o bloco recebe borda/fundo vermelho suave.
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
      <div className="mt-3 flex items-start gap-3">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex flex-1 flex-col gap-1 rounded-md px-3 py-2",
              !it.ok &&
                "border border-badge-danger-fg/40 bg-badge-danger-bg/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tabular text-foreground">
                {it.label}
              </span>
              {it.ok ? (
                <CheckCircle2 className="h-6 w-6 text-badge-ok-fg" />
              ) : (
                <XCircle className="h-6 w-6 text-badge-danger-fg" />
              )}
            </div>
            <span className="text text-muted-foreground">
              {`há ${it.mins} minuto${it.mins === 1 ? "" : "s"}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}