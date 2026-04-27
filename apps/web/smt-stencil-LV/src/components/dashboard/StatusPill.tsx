import { cn } from "@/lib/utils";
import type { StatusBadge } from "@/data/mockWashes";
import ativoIcon from "@/assets/status-ativo.svg";
import inativoIcon from "@/assets/status-inativo.svg";

const styles: Record<StatusBadge, string> = {
  Ativo: "bg-badge-ok-bg text-badge-ok-fg",
  Inativo: "bg-badge-danger-bg text-badge-danger-fg",
};

const icons: Record<StatusBadge, string> = {
  Ativo: ativoIcon,
  Inativo: inativoIcon,
};

export function StatusPill({ status }: { status: StatusBadge }) {
  return (
    <span
  className={cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-lg font-normal",
    styles[status],
  )}
>
      <img src={icons[status]} alt="" aria-hidden="true" className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

