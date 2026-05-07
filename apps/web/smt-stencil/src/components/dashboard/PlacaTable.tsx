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

export function PlacaTable({ rows, selectedId, onSelect, sort, onToggleSort }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Linhas em 18px Regular (font-body) — img1 */}
      <table className="w-full text-lg font-normal">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="table-head-cell px-4 py-3 text-left">
              <button
                type="button"
                onClick={onToggleSort}
                className="inline-flex items-center gap-2 text-left font-semibold text-primary-foreground"
              >
                <span>Data</span>
                <ArrowUpDown className={cn("h-4 w-4 transition-transform", sort === "asc" && "rotate-180")} />
              </button>
            </th>
            <th className="table-head-cell px-4 py-3 text-left">Hora</th>
            <th className="table-head-cell px-4 py-3 text-left">Turno</th>
            <th className="table-head-cell px-4 py-3 text-left">Modelo</th>
            <th className="table-head-cell px-4 py-3 text-left">Face</th>
            <th className="table-head-cell px-4 py-3 text-left">Linha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.id === selectedId;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors",
                  selected ? "bg-row-selected" : "hover:bg-row-stripe",
                )}
              >
                <td className="px-4 py-3 tabular">{row.data}</td>
                <td className="px-4 py-3 tabular">{row.hora}</td>
                <td className="px-4 py-3">{row.turno}</td>
                <td className="px-4 py-3">{row.modelo}</td>
                <td className="px-4 py-3">{row.face}</td>
                <td className="px-4 py-3">{row.linha}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
