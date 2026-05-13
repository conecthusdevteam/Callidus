import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { isWashOutsideStandardSchedule } from "@/data/mockWashes";
import type { StencilWash } from "@/data/mockWashes";
import attentionIcon from "@/assets/icon-attention-triangle.svg";
import { ArrowUpDown } from "lucide-react";
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

export function StencilTable({
  rows,
  selectedId,
  onSelect,
  sort,
  onToggleSort,
}: Props) {
  return (
    <div className="relative overflow-visible rounded-lg border bg-card">
      <table className="w-full text-base font-normal">
        <thead>
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
            const attention = isWashOutsideStandardSchedule(row.hora);
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors",
                  attention && "bg-row-attention",
                  selected && "bg-row-selected",
                  !attention && !selected && "hover:bg-row-stripe",
                )}
              >
                <td className="px-4 py-2 tabular text-foreground">
                  {row.data}
                </td>
                <td className="px-4 py-2 tabular text-foreground">
                  {row.hora}
                </td>
                <td className="px-4 py-2 text-foreground">{row.codigo}</td>
                <td className="px-4 py-2 tabular text-foreground">
                  {row.enderecamento}
                </td>
                <td className="px-4 py-2">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="px-4 py-2 text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{row.linha}</span>
                    {attention && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <img
                            src={attentionIcon}
                            alt=""
                            className="h-5 w-5 shrink-0"
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="center"
                          className="max-w-xs rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-xl"
                        >
                          <p className="text-sm font-semibold">
                            Intervalo anormal
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            A última lavagem aconteceu no dia {row.data} às{" "}
                            {row.hora}.
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
