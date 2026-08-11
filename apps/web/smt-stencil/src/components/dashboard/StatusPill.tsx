import { cn } from "@/lib/utils";
import type { StatusBadge } from "@/data/mockWashes";
import ativoIcon from "@/assets/status-ativo.svg";
import inativoIcon from "@/assets/status-inativo.svg";

const styles: Record<StatusBadge, string> = {
  Ativo: "border border-[#31C48D] bg-[#BCF0DA] text-black",
  Inativo: "bg-badge-danger-bg text-black",
};

const icons: Record<StatusBadge, string> = {
  Ativo: ativoIcon,
  Inativo: inativoIcon,
};

export function StatusPill({ status }: { status: StatusBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[18px] font-medium leading-none",
        styles[status],
      )}
    >
      <img
        src={icons[status]}
        alt=""
        aria-hidden="true"
        className="h-3.5 w-3.5"
      />
      {status}
    </span>
  );
}
