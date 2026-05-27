import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import {
  isWashOutsideStandardSchedule,
  type StencilAttentionType,
} from "@/data/mockWashes";
import type { StencilWash } from "@/data/mockWashes";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  rows: StencilWash[];
  selectedId?: string;
  onSelect: (row: StencilWash) => void;
  sort?: "asc" | "desc" | null;
  onToggleSort?: () => void;
}

const ATTENTION_STYLE: Record<
  StencilAttentionType,
  {
    row: string;
    icon: string;
    title: string;
    message: (row: StencilWash) => string;
  }
> = {
  multiple: {
    row: "border-y border-[#9061F9] bg-[#EDEBFE]",
    icon: "text-[#9061F9]",
    title: "Lavagem múltipla",
    message: (row) =>
      `Nova lavagem registrada no dia ${row.data} às ${row.hora}.`,
  },
  anomalous: {
    row: "border-y border-[#DB0101] bg-[#FBD5D5]",
    icon: "text-[#DB0101]",
    title: "Intervalo anormal",
    message: (row) =>
      `A última lavagem aconteceu no dia ${row.data} às ${row.hora}.`,
  },
};

export function StencilTable({
  rows,
  selectedId,
  onSelect,
  sort,
  onToggleSort,
}: Props) {
  return (
    <div className="h-full flex flex-col">
      <table className="w-full text-lg font-normal">
        <thead className="sticky top-0 z-10">
          <tr className="bg-table-head text-table-head-foreground">
            <th className="table-head-cell px-4 py-2 text-left">
              <button
                type="button"
                onClick={onToggleSort}
                className="inline-flex items-center gap-2 text-left font-semibold text-white"
              >
                <span>Data</span>
                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="table-head-cell px-4 py-2 text-left">Hora</th>
            <th className="table-head-cell px-4 py-2 text-left">Código</th>
            <th className="table-head-cell px-4 py-2 text-left">Endereç.</th>
            <th className="table-head-cell px-4 py-2 text-left">Status</th>
            <th className="table-head-cell px-4 py-2 text-left">Linha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.id === selectedId;
            const attention =
              row.attention ?? isWashOutsideStandardSchedule(row.hora);
            const attentionType =
              row.attentionType ??
              (attention ? ("anomalous" as StencilAttentionType) : undefined);
            const attentionStyle = attentionType
              ? ATTENTION_STYLE[attentionType]
              : undefined;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors",
                  attentionStyle?.row,
                  selected && "bg-row-selected",
                  !attention && !selected && "hover:bg-row-stripe",
                )}
              >
                <td className="px-4 py-3 tabular text-foreground">
                  {row.data}
                </td>
                <td className="px-4 py-3 tabular text-foreground">
                  {row.hora}
                </td>
                <td className="px-4 py-3 text-foreground">{row.codigo}</td>
                <td className="px-4 py-3 tabular text-foreground">
                  {row.enderecamento}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="px-4 py-3 text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{row.linha}</span>
                    {attention && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle
                            aria-hidden="true"
                            className={cn(
                              "h-5 w-5 shrink-0",
                              attentionStyle?.icon,
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="center"
                          className="max-w-xs rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-xl"
                        >
                          <p className="text-sm font-semibold">
                            {attentionStyle?.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {attentionStyle?.message(row)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
