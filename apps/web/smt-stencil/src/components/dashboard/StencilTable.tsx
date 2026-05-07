import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { isWashOutsideStandardSchedule } from "@/data/mockWashes";
import type { StencilWash } from "@/data/mockWashes";
import attentionIcon from "@/assets/icon-attention-triangle.svg";

interface Props {
  rows: StencilWash[];
  selectedId?: string;
  onSelect: (row: StencilWash) => void;
}

export function StencilTable({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="relative overflow-visible rounded-lg border bg-card">
      {/* Linhas em 18px Regular (font-body) — img1 */}
        <table className="w-full text-lg font-normal">
        <thead>
          <tr className="bg-table-head text-table-head-foreground">
            {["Data", "Hora", "Código", "Endereçamento", "Status", "Linha"].map((h) => (
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
                <td className="px-4 py-3 tabular text-foreground">{row.data}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.hora}</td>
                <td className="px-4 py-3 text-foreground">{row.codigo}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.enderecamento}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="px-4 py-3 text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{row.linha}</span>
                    {attention && (
                      <img
                        src={attentionIcon}
                        alt=""
                        aria-label="Intervalo de lavagem fora do padrão"
                        title="Intervalo de lavagem fora do padrão"
                        className="h-5 w-5 shrink-0"
                      />
                    )}
                  </div>
                </td>
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
