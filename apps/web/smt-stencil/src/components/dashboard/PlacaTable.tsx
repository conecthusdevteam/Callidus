import { cn } from "@/lib/utils";
import type { PlacaWash } from "@/data/mockWashes";

interface Props {
  rows: PlacaWash[];
  selectedId?: string;
  onSelect: (row: PlacaWash) => void;
}

export function PlacaTable({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Linhas em 18px Regular (font-body) — img1 */}
      <table className="w-full text-lg font-normal">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {["Data", "Hora", "Turno", "Modelo", "Face", "Linha"].map((h) => (
  <th
    key={h}
    className="table-head-cell px-4 py-3 text-left"
  >
    {h}
  </th>
))}
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
