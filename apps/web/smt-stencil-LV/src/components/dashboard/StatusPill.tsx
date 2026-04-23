import { cn } from "@/lib/utils";
import type { StatusBadge } from "@/data/mockWashes";

const styles: Record<StatusBadge, string> = {
  Ativo: "bg-badge-ok-bg text-badge-ok-fg",
  Inativo: "bg-badge-danger-bg text-badge-danger-fg",
};

const dots: Record<StatusBadge, string> = {
  Ativo: "bg-badge-ok-fg",
  Inativo: "bg-badge-danger-fg",
};

export function StatusPill({ status }: { status: StatusBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}
