import { Button } from "@/components/ui/button";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

interface Props {
  item: StencilWash | PlacaWash | null;
  onClose?: () => void;
}

/**
 * Formata ID Lavagem para XXXX:XX (máximo 6 caracteres)
 * Exemplo: "stencil_r4nMr_cXrwLL5QwMrZW6X" → "r4nM:r4"
 */
function formatarIdLavagem(id: string): string {
  if (!id || id === "—") return "—";
  // Remove caracteres especiais e mantém apenas alfanuméricos
  const limpo = id.replace(/[^a-zA-Z0-9]/g, "");
  if (limpo.length <= 4) return limpo;
  // Pega 4 primeiros + 2 dígitos/letras, separados por dois pontos
  return `${limpo.substring(0, 4)}:${limpo.substring(4, 6)}`.toUpperCase();
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
  const idLavagem = formatarIdLavagem(item.idLavagem ?? "—");
  const ultData = item.ultimaLavagemData ?? "—";
  const ultHora = item.ultimaLavagemHora ?? "—";
  const operador = item.operador ?? "—";

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 shadow-card animate-fade-in">
      {/* Código em destaque */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{codigoLabel}</p>
        <p className="mt-1 break-all text-lg font-bold text-foreground">{codigoValue}</p>
      </div>

      {/* ID Fabricante / País */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">ID Fabricante</p>
          <p className="mt-1 text-sm font-bold text-foreground">{idFabricante}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">País de Origem</p>
          <p className="mt-1 text-sm font-bold text-foreground">{pais}</p>
        </div>
      </div>

      {/* Espessura / Endereçamento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Espessura</p>
          <p className="mt-1 text-sm font-bold tabular text-foreground">{espessura}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Endereçamento</p>
          <p className="mt-1 text-sm font-bold tabular text-foreground">{enderecamento}</p>
        </div>
      </div>

      {/* Total de lavagens */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total de Lavagens</p>
        <p className="mt-1 text-lg font-bold tabular text-foreground">
          {String(total).padStart(3, "0")} lavagens
        </p>
      </div>

      {/* Bloco "Dados da última lavagem" */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">Dados da última lavagem</p>
        
        {/* Linha com ID Lavagem, Data e Hora */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ID Lavagem</p>
            <p className="mt-1 text-base font-bold text-foreground">{idLavagem}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="mt-1 text-base font-bold text-foreground">{ultData}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Hora</p>
            <p className="mt-1 text-base font-bold text-foreground">{ultHora}</p>
          </div>
        </div>
        
        {/* Operador em linha separada */}
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">Operador de Lavagem</p>
          <p className="mt-1 text-sm font-bold text-foreground">{operador}</p>
        </div>
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
