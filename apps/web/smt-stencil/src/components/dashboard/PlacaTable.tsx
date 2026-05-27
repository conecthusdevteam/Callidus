import { cn } from "@/lib/utils";
import type { PlacaWash } from "@/data/mockWashes";
import { ArrowUpDown } from "lucide-react";

interface Props {
  rows: PlacaWash[];
  selectedId?: string;
  onSelect: (row: PlacaWash) => void;
  sort?: "asc" | "desc" | null;
  onToggleSort?: () => void;
}

export function PlacaTable({
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
          <tr className="bg-primary text-primary-foreground">
            <th className="table-head-cell px-4 py-3 text-left">
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
            <th className="table-head-cell px-4 py-3 text-left">Hora</th>
            <th className="table-head-cell px-4 py-3 text-left">Turno</th>
            <th className="table-head-cell px-4 py-3 text-left">Modelo</th>
            <th className="table-head-cell px-4 py-3 text-left">Fase</th>
            <th className="table-head-cell px-4 py-3 text-left">Linha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const selected = row.id === selectedId;
            const isEven = index % 2 === 0;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={cn(
                  "cursor-pointer transition-colors",
                  selected
                    ? "bg-row-selected"
                    : isEven
                      ? "bg-white"
                      : "bg-[#E5E5E5]",
                )}
              >
                <td className="px-4 py-4 tabular text-foreground">
                  {row.data}
                </td>
                <td className="px-4 py-4 tabular text-foreground">
                  {row.hora}
                </td>
                <td className="px-4 py-4 text-foreground">{row.turno}</td>
                <td className="px-4 py-4 text-foreground">{row.modelo}</td>
                <td className="px-4 py-4 text-foreground">{row.fase}</td>
                <td className="px-4 py-4 text-foreground">{row.linha}</td>
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
