import { Button } from "@/components/ui/button";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

interface Props {
  item: StencilWash | PlacaWash | null;
  onClose?: () => void;
}

/**
 * Painel lateral de detalhes de um item (stencil ou placa) selecionado.
 */
export function DetailsPanel({ item, onClose }: Props) {
  if (!item) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
        Selecione um item da lista para ver os detalhes.
      </div>
    );
  }

  const isStencil = "codigo" in item;
  const product = item.product ?? (isStencil ? item.codigo : item.modelo);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5 shadow-card animate-fade-in">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Produto</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">{product}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {isStencil && (item as StencilWash).pais && (
          <Field label="País" value={(item as StencilWash).pais!} />
        )}
        {isStencil && (item as StencilWash).revisao && (
          <Field label="Revisão" value={(item as StencilWash).revisao!} />
        )}
        {!isStencil && (item as PlacaWash).codigoBarras && (
          <Field label="Cód. barras" value={(item as PlacaWash).codigoBarras!} />
        )}
        {!isStencil && (item as PlacaWash).serial && (
          <Field label="Serial" value={(item as PlacaWash).serial!} />
        )}
        {isStencil && (item as StencilWash).largura && (
          <>
            <Field label="Largura" value={(item as StencilWash).largura!} />
            <Field label="Altura" value={(item as StencilWash).altura!} />
          </>
        )}
      </div>

      {item.totalLavagens !== undefined && (
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total de lavagens
          </p>
          <p className="mt-1 text-2xl font-semibold tabular text-foreground">
            {item.totalLavagens} lavagens
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Última lavagem" value={item.ultimaLavagem ?? "—"} />
        <Field label="Próxima prev." value={item.proximaPrev ?? "—"} />
      </div>

      {item.obs && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Observação</p>
          <p className="mt-1 text-sm text-foreground">{item.obs}</p>
        </div>
      )}

      <Button
        onClick={onClose}
        className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        Fechar detalhes
      </Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 tabular text-foreground">{value}</p>
    </div>
  );
}
