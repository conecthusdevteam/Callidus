import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/data/mockWashes";

/**
 * Card "Status fornecimento de dados" (img3).
 * - Borda esquerda em destaque (roxa)
 * - SGS / CLP — verde quando OK, item em vermelho com fundo claro quando offline
 */
export function SystemStatusCard({ status }: { status: SystemStatus }) {
  const items = [
    { label: "SGS", ok: status.scs.ok, mins: status.scs.lastSyncMin },
    { label: "CLP", ok: status.clp.ok, mins: status.clp.lastSyncMin },
  ];

  return (
    <div className="rounded-xl border border-l-4 border-l-status-accent bg-card p-4 shadow-card">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        Status fornecimento de dados
      </p>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
              !it.ok && "border border-destructive/60 bg-destructive/10",
            )}
          >
            <span
              className={cn(
                "min-w-[44px] text-2xl font-bold tabular",
                it.ok ? "text-foreground" : "text-foreground",
              )}
            >
              {it.label}
            </span>
            {it.ok ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="text-sm text-muted-foreground">
              {`há ${it.mins} minuto${it.mins === 1 ? "" : "s"}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}