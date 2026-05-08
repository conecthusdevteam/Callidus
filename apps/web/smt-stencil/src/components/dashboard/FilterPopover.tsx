import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import filterIcon from "@/assets/icon-filter.svg";

export interface StencilFilters {
  codigo: string;
  idFabricante: string;
  pais: string;
  status: string; // "" | "Ativo" | "Inativo"
  ordem: "asc" | "desc" | "";
}

export interface PlacaFilters {
  modelo: string;
  blankId: string;
  serial: string;
  linha: string;
}

export const emptyStencilFilters: StencilFilters = {
  codigo: "",
  idFabricante: "",
  pais: "",
  status: "",
  ordem: "",
};

export const emptyPlacaFilters: PlacaFilters = {
  modelo: "",
  blankId: "",
  serial: "",
  linha: "",
};

interface Props {
  tab: "stencil" | "placas";
  stencilFilters: StencilFilters;
  placaFilters: PlacaFilters;
  onApplyStencil: (f: StencilFilters) => void;
  onApplyPlaca: (f: PlacaFilters) => void;
}

export function FilterPopover({
  tab,
  stencilFilters,
  placaFilters,
  onApplyStencil,
  onApplyPlaca,
}: Props) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<StencilFilters>(stencilFilters);
  const [p, setP] = useState<PlacaFilters>(placaFilters);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setS(stencilFilters);
      setP(placaFilters);
    }
  };

  const handleCancel = () => setOpen(false);

  const handleSearch = () => {
    if (tab === "stencil") onApplyStencil(s);
    else onApplyPlaca(p);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
     <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-[50px] items-center gap-2 rounded-lg border bg-card px-4 text-base font-medium text-foreground shadow-card transition-colors hover:bg-muted"
        >
          <img src={filterIcon} alt="" className="h-4 w-4" />
          Filtrar
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-[400px] rounded-lg border bg-card p-4 shadow-elevated"
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Adicione uma ou mais informações para filtrar.
        </p>

        {tab === "stencil" ? (
          <div className="space-y-3">
            <Field label="Código">
              <Input value={s.codigo} onChange={(e) => setS({ ...s, codigo: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID Fabricante">
                <Input
                  value={s.idFabricante}
                  onChange={(e) => setS({ ...s, idFabricante: e.target.value })}
                />
              </Field>
              <Field label="País Origem">
                <Input
                  value={s.pais}
                  onChange={(e) => setS({ ...s, pais: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <Select
                  value={s.status || "all"}
                  onValueChange={(v) => setS({ ...s, status: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ordem">
                <Select
                  value={s.ordem || "none"}
                  onValueChange={(v) =>
                    setS({ ...s, ordem: v === "none" ? "" : (v as "asc" | "desc") })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Modelo">
              <Input value={p.modelo} onChange={(e) => setP({ ...p, modelo: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Blank ID">
                <Input
                  value={p.blankId}
                  onChange={(e) => setP({ ...p, blankId: e.target.value })}
                />
              </Field>
              <Field label="Serial">
                <Input
                  value={p.serial}
                  onChange={(e) => setP({ ...p, serial: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Linha solicitante">
              <Input value={p.linha} onChange={(e) => setP({ ...p, linha: e.target.value })} />
            </Field>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-action-blue px-4 text-sm font-medium text-white transition-colors hover:bg-action-blue-hover"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}
