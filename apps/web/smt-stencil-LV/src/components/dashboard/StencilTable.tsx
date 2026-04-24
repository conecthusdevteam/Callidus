import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import type { StencilWash } from "@/data/mockWashes";

interface Props {
  rows: StencilWash[];
  selectedId?: string;
  onSelect: (row: StencilWash) => void;
}

export function StencilTable({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {["Data", "Hora", "Código", "Endereçamento", "Status", "Linha"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
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
                  row.attention && "bg-row-attention",
                  selected && "bg-row-selected",
                  !row.attention && !selected && "hover:bg-row-stripe",
                )}
              >
                <td className="px-4 py-3 tabular text-foreground">{row.data}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.hora}</td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{row.codigo}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.enderecamento}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="px-4 py-3 text-foreground">{row.linha}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
