import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StencilWash } from "@/data/mockWashes";
import {
  isWashOutsideStandardSchedule,
  type StencilAttentionType,
} from "@/data/mockWashes";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import { StatusPill } from "./StatusPill";

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
    message: (row) => {
      if (row.latestWashData && row.latestWashHora) {
        return `Nova lavagem registrada no dia ${formatShortDate(row.latestWashData)} às ${row.latestWashHora}.`;
      }

      if (row.previousWashData && row.previousWashHora) {
        return `A lavagem anterior aconteceu no dia ${formatShortDate(row.previousWashData)} às ${row.previousWashHora}.`;
      }

      return "Não há outra lavagem registrada para este stencil.";
    },
  },
  anomalous: {
    row: "border-y border-[#DB0101] bg-[#FBD5D5]",
    icon: "text-[#DB0101]",
    title: "Lavagem anormal",
    message: () =>
      "Lavagem registrada fora dos intervalos padrões (11h-12h e 16h-17h)",
  },
};

function parseWashTimestamp(row: Pick<StencilWash, "data" | "hora">) {
  const [day, month, year] = row.data.split("/").map(Number);
  const [hours, minutes] = row.hora.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

function formatShortDate(date: string) {
  const [day, month] = date.split("/");
  return `${day}/${month}`;
}

function withMultipleWashReferences(rows: StencilWash[]) {
  const rowsByStencil = new Map<string, StencilWash[]>();

  rows.forEach((row) => {
    rowsByStencil.set(row.codigo, [
      ...(rowsByStencil.get(row.codigo) ?? []),
      row,
    ]);
  });

  const referencesById = new Map<
    string,
    Pick<
      StencilWash,
      | "previousWashData"
      | "previousWashHora"
      | "previousWashInterval"
      | "latestWashData"
      | "latestWashHora"
    >
  >();

  rowsByStencil.forEach((stencilRows) => {
    const ordered = [...stencilRows].sort(
      (a, b) => parseWashTimestamp(a) - parseWashTimestamp(b),
    );
    const latest = ordered.at(-1);

    ordered.forEach((row, index) => {
      const previous = ordered[index - 1];
      const isLatest = latest?.id === row.id;
      const previousInterval =
        row.previousWashInterval ??
        (previous
          ? Math.round(
              (parseWashTimestamp(row) - parseWashTimestamp(previous)) / 60_000,
            )
          : null);

      referencesById.set(row.id, {
        previousWashData: previous?.data,
        previousWashHora: previous?.hora,
        previousWashInterval: previousInterval,
        latestWashData: !isLatest ? latest?.data : undefined,
        latestWashHora: !isLatest ? latest?.hora : undefined,
      });
    });
  });

  return rows.map((row) => ({
    ...row,
    ...referencesById.get(row.id),
  }));
}

export function StencilTable({
  rows,
  selectedId,
  onSelect,
  sort,
  onToggleSort,
}: Props) {
  const rowsWithReferences = useMemo(
    () => withMultipleWashReferences(rows),
    [rows],
  );

  return (
    <div className="h-full flex flex-col">
      <table className="w-full table-fixed text-[24px] font-normal">
        <thead className="sticky top-0 z-10">
          <tr className="bg-table-head text-table-head-foreground">
            <th className="table-head-cell w-[140px] px-3 py-2 text-left">
              <button
                type="button"
                onClick={onToggleSort}
                className="inline-flex items-center gap-2 text-left font-semibold text-white"
              >
                <span>Hora</span>
                <ArrowUpDown
                  className={cn(
                    "h-6 w-6 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="table-head-cell px-3 py-2 text-left">Código</th>
            <th className="table-head-cell w-[150px] px-3 py-2 text-left">
              Status
            </th>
            <th className="table-head-cell w-[210px] px-3 py-2 text-left">
              Linha
            </th>
          </tr>
        </thead>
        <tbody>
          {rowsWithReferences.map((row) => {
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
                <td className="px-3 py-6 tabular text-foreground">
                  {row.hora}
                </td>
                <td className="truncate px-3 py-6 text-foreground">
                  {row.codigo}
                </td>
                <td className="px-3 py-6">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="px-3 py-6 text-foreground">
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
                          className="max-w-[246px] rounded-sm border border-[#393939] bg-[#393939] py-2 px-4 text-white shadow-xl text-justify"
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
                colSpan={5}
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
