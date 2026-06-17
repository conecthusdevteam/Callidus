import { Button } from "@/components/ui/button";
import type { PlacaWash, StencilWash } from "@/data/mockWashes";
import { cn } from "@/lib/utils";

interface Props {
  item: StencilWash | PlacaWash | null;
  onClose?: () => void;
}

function formatarIdLavagem(id: string): string {
  if (!id || id === "—") return "—";
  const limpo = id.replace(/[^a-zA-Z0-9]/g, "");
  if (limpo.length <= 4) return limpo;
  return `${limpo.substring(0, 4)}:${limpo.substring(4, 6)}`.toUpperCase();
}

function isStencilWash(item: StencilWash | PlacaWash): item is StencilWash {
  return !("fase" in item);
}

export function DetailsPanel({ item, onClose }: Props) {
  if (!item) return null;

  const isStencil = isStencilWash(item);
  const total = item.totalLavagens ?? 0;
  const idLavagem = formatarIdLavagem(item.idLavagem ?? "—");
  const ultData = item.ultimaLavagemData ?? "—";
  const ultHora = item.ultimaLavagemHora ?? "—";
  const operador = item.operador ?? "—";

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 shadow-card animate-fade-in">
      {isStencil ? (
        <StencilDetails item={item as StencilWash} />
      ) : (
        <PlacaDetails item={item as PlacaWash} />
      )}

      {/* Total de lavagens */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Total de Lavagens Registradas
        </p>
        <p className="mt-1 text-[24px] font-bold tabular text-foreground">
          {String(total).padStart(3, "0")} lavagens
        </p>
      </div>

      {/* Dados da última lavagem */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Dados da lavagem
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ID Lavagem</p>
            <p className="mt-1 text-base font-bold text-foreground">
              {idLavagem}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="mt-1 text-base font-bold text-foreground">
              {ultData}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Hora</p>
            <p className="mt-1 text-base font-bold text-foreground">
              {ultHora}
            </p>
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">Operador de Lavagem</p>
          <p className="mt-1 text-sm font-bold text-foreground">{operador}</p>
        </div>
      </div>

      <Button
        onClick={onClose}
        className={cn(
          "w-full text-white",
          isStencil
            ? "bg-action-blue hover:bg-action-blue-hover"
            : "bg-primary hover:bg-primary-hover",
        )}
      >
        Fechar detalhes
      </Button>
    </div>
  );
}

// ── Detalhes exclusivos do Stencil ───────────────────────────────────────────

function StencilDetails({ item }: { item: StencilWash }) {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Código Stencil
        </p>
        <p className="mt-1 break-all text-lg font-bold text-foreground">
          {item.codigo}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            ID Fabricante
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {item.idFabricante ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            País de Origem
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {item.pais ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Espessura
          </p>
          <p className="mt-1 text-sm font-bold tabular text-foreground">
            {item.espessura ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Endereçamento
          </p>
          <p className="mt-1 text-sm font-bold tabular text-foreground">
            {item.enderecamento}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Detalhes exclusivos da Placa ─────────────────────────────────────────────

function PlacaDetails({ item }: { item: PlacaWash }) {
  return (
    <>
      {/* "Modelo Placa"*/}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Modelo Placa
        </p>
        <p className="mt-1 break-all text-lg font-bold text-foreground">
          {item.modelo}
        </p>
      </div>

      {/* Serial e Blank ID lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Serial
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {item.serial ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Blank ID
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {item.codigoBarras ?? "—"}
          </p>
        </div>
      </div>
    </>
  );
}
