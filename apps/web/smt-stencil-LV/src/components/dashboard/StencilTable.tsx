import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
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
          <tr className="bg-primary text-primary-foreground">
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
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors",
                  row.attention && "bg-row-attention",  // fundo 
                  selected && "bg-row-selected",
                  !row.attention && !selected && "hover:bg-row-stripe",
                )}
              >
                <td className="px-4 py-3 tabular text-foreground">{row.data}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.hora}</td>
                <td className="px-4 py-3 text-foreground">{row.codigo}</td>
                <td className="px-4 py-3 tabular text-foreground">{row.enderecamento}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.motivo} />
                </td>
                <td className="relative px-4 py-3 text-foreground">
                  {row.linha}
                  {row.attention && (
                    <span
                      aria-label="Intervalo de lavagem fora do padrão"
                      title="Intervalo de lavagem fora do padrão"
                      className="absolute left-full top-1/2 ml-3 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: "hsl(0 90% 96%)" }}  // 👈 círculo rosa
                    >
                      <img src={attentionIcon} alt="" className="h-4 w-4" />  {/* 👈 triângulo vermelho */}
                    </span>
                  )}
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
