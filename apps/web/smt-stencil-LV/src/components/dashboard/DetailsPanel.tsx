import { Button } from "@/components/ui/button";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

interface Props {
  item: StencilWash | PlacaWash | null;
  onClose?: () => void;
}

/**
 * Painel lateral de detalhes — layout conforme img2.
 *
 * Estrutura:
 *  • Código (Stencil ou Placa) em destaque
 *  • Grid 2 colunas: ID Fabricante / País de Origem
 *  • Grid 2 colunas: Espessura / Endereçamento
 *  • Total de Lavagens Registradas
 *  • Bloco "Dados da última lavagem" com ID Lavagem / Data / Hora / Operador
 *  • Botão "Fechar detalhes"
 */
export function DetailsPanel({ item, onClose }: Props) {
  if (!item) {
    return null;
  }

  const isStencil = "codigo" in item;
  const codigoLabel = isStencil ? "Código Stencil" : "Código Placa";
  const codigoValue = isStencil
    ? (item as StencilWash).codigo
    : (item as PlacaWash).modelo;

  const idFabricante = item.idFabricante ?? "—";
  const pais = item.pais ?? "—";
  const espessura = item.espessura ?? "—";
  const enderecamento = isStencil
    ? (item as StencilWash).enderecamento
    : ((item as PlacaWash).enderecamento ?? "—");
  const total = item.totalLavagens ?? 0;
  const idLavagem = item.idLavagem ?? "—";
  const ultData = item.ultimaLavagemData ?? "—";
  const ultHora = item.ultimaLavagemHora ?? "—";
  const operador = item.operador ?? "—";

  return (
    <div className="space-y-5 rounded-xl border bg-card p-5 shadow-card animate-fade-in">
      {/* Código em destaque */}
      <Field label={codigoLabel} value={codigoValue} valueClass="text-xl font-bold" />

      {/* ID Fabricante / País */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="ID Fabricante" value={idFabricante} valueClass="text-lg font-bold" />
        <Field label="País de Origem" value={pais} valueClass="text-lg font-bold" />
      </div>

      {/* Espessura / Endereçamento */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Espessura" value={espessura} valueClass="text-lg font-bold" />
        <Field label="Endereçamento" value={enderecamento} valueClass="text-lg font-bold" />
      </div>

      {/* Total de lavagens */}
      <div>
        <p className="text-sm text-muted-foreground">Total de Lavagens Registradas</p>
        <p className="mt-1 text-lg font-bold tabular text-foreground">
          {String(total).padStart(3, "0")} lavagens
        </p>
      </div>

      {/* Bloco "Dados da última lavagem" */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Dados da última lavagem</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ID Lavagem" value={idLavagem} valueClass="text-base font-bold tabular" />
          <Field label="Data" value={ultData} valueClass="text-base font-bold tabular" />
          <Field label="Hora" value={ultHora} valueClass="text-base font-bold tabular" />
        </div>
        <Field label="Operador de Lavagem" value={operador} valueClass="text-base font-bold" />
      </div>

      <Button
        onClick={onClose}
        className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        Fechar detalhes
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  valueClass = "text-base font-semibold",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-foreground ${valueClass}`}>{value}</p>
    </div>
  );
}