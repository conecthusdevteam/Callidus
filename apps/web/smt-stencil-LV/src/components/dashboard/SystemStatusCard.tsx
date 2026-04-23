import { CheckCircle2, AlertCircle } from "lucide-react";
import type { SystemStatus } from "@/data/mockWashes";

/**
 * Card permanente de Status dos Sistemas (RP-04).
 * SCS / CLP — verde quando OK, vermelho quando há problema.
 */
export function SystemStatusCard({ status }: { status: SystemStatus }) {
  const items = [
    { label: "SCS", ok: status.scs.ok, mins: status.scs.lastSyncMin },
    { label: "CLP", ok: status.clp.ok, mins: status.clp.lastSyncMin },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Status sistemas leitores
      </p>
      <div className="space-y-2.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <span
              className={`text-2xl font-bold tabular ${
                it.ok ? "text-primary" : "text-destructive"
              }`}
            >
              {it.label}
            </span>
            {it.ok ? (
              <CheckCircle2 className="h-5 w-5 text-primary animate-pulse-dot" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive animate-pulse-dot" />
            )}
            <span className="text-xs text-muted-foreground">
              {it.ok ? `há ${it.mins} minuto${it.mins === 1 ? "" : "s"}` : "Falha"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
