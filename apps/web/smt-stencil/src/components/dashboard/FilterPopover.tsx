import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import filterIcon from "@/assets/icon-filter.svg";

export interface StencilFilters {
  hora: string;
  codigo: string;
  enderecamento: string;
  idFabricante: string;
  pais: string;
  status: string;
  linha: string;
  ordem: "asc" | "desc" | "";
}

export interface PlacaFilters {
  hora: string;
  turno: string;
  modelo: string;
  blankId: string;
  fase: string;
  serial: string;
  linha: string;
  ordem: "asc" | "desc" | "";
}

export const emptyStencilFilters: StencilFilters = {
  hora: "",
  codigo: "",
  enderecamento: "",
  idFabricante: "",
  pais: "",
  status: "",
  ordem: "",
  linha: "",
};

export const emptyPlacaFilters: PlacaFilters = {
  hora: "",
  turno: "",
  modelo: "",
  blankId: "",
  fase: "",
  serial: "",
  linha: "",
  ordem: "",
};

const LINHAS = [
  "Manaus",
  "Tefé",
  "Coari",
  "Maués",
  "Parintins",
  "Itacoatiara",
  "Manacapuru",
  "Tabatinga",
  "Humaitá",
  "Presidente Figueiredo",
];
interface TriggerProps {
  open: boolean;
  onToggle: () => void;
}

export function FilterTrigger({ open, onToggle }: TriggerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-[50px] items-center gap-2 rounded-lg border bg-card px-4 text-base font-medium text-foreground shadow-card transition-colors hover:bg-muted"
    >
      <img src={filterIcon} alt="" className="h-4 w-4" />
      Filtrar
      <ChevronDown
        className={cn(
          "h-4 w-4 transition-transform text-muted-foreground",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

interface PanelProps {
  tab: "stencil" | "placas";
  stencilFilters: StencilFilters;
  placaFilters: PlacaFilters;
  onApplyStencil: (f: StencilFilters) => void;
  onApplyPlaca: (f: PlacaFilters) => void;
}

export function FilterPanel({
  tab,
  stencilFilters,
  placaFilters,
  onApplyStencil,
  onApplyPlaca,
}: PanelProps) {
  const [s, setS] = useState<StencilFilters>(stencilFilters);
  const [p, setP] = useState<PlacaFilters>(placaFilters);

  const handleSearch = () => {
    if (tab === "stencil") onApplyStencil(s);
    else onApplyPlaca(p);
  };

  const handleClear = () => {
    if (tab === "stencil") {
      setS(emptyStencilFilters);
      onApplyStencil(emptyStencilFilters);
    } else {
      setP(emptyPlacaFilters);
      onApplyPlaca(emptyPlacaFilters);
    }
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 pt-3 pb-6 shadow-sm shrink-0 mb-4">
      <p className="mb-3 text-[16px] text-muted-foreground">
        Adicione uma ou mais informações para filtrar.
      </p>

      {tab === "stencil" ? (
        <div className="flex items-end gap-3 flex-wrap">
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Hora</span>}
          >
            <Input
              value={s.hora}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");

                value = value.slice(0, 4);

                if (value.length >= 3) {
                  value = `${value.slice(0, 2)}:${value.slice(2)}`;
                }
                const [h, m] = value.split(":");
                if ((h && Number(h) > 23) || (m && Number(m) > 59)) {
                  return;
                }
                setS({ ...s, hora: value });
              }}
              placeholder="00:00"
              maxLength={5}
              className="h-10 w-[120px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Código</span>}
          >
            <Input
              value={s.codigo}
              onChange={(e) => setS({ ...s, codigo: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-10 w-[280px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Endereç.</span>}
          >
            <Input
              value={s.enderecamento}
              onChange={(e) => setS({ ...s, enderecamento: e.target.value })}
              className="h-10 w-[120px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Status</span>}
          >
            <Select
              value={s.status || "all"}
              onValueChange={(v) =>
                setS({ ...s, status: v === "all" ? "" : v })
              }
            >
              <SelectTrigger className="h-10 w-[180px] text-[13px] bg-white rounded-md">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">ID Fab.</span>}
          >
            <Input
              value={s.idFabricante}
              onChange={(e) => setS({ ...s, idFabricante: e.target.value })}
              className="h-10 w-[130px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={
              <span className="text-[18px] text-[#0A0A0A]">
                Linha Solicitante
              </span>
            }
          >
            <Select
              value={s.linha || "all"}
              onValueChange={(v) => setS({ ...s, linha: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-[260px] text-[13px] bg-white rounded-md">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {LINHAS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="w-full flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#1d5be3] px-4 text-[18px] font-semibold text-white hover:bg-[#1749b6] whitespace-nowrap"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-8 items-center text-[18px] text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-3 flex-wrap">
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Hora</span>}
          >
            <Input
              value={p.hora}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");

                value = value.slice(0, 4);

                if (value.length >= 3) {
                  value = `${value.slice(0, 2)}:${value.slice(2)}`;
                }

                const [h, m] = value.split(":");

                if ((h && Number(h) > 23) || (m && Number(m) > 59)) {
                  return;
                }

                setP({ ...p, hora: value });
              }}
              placeholder="00:00"
              maxLength={5}
              className="h-10 w-[120px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Turno</span>}
          >
            <Input
              value={p.turno}
              onChange={(e) => setP({ ...p, turno: e.target.value })}
              className="h-10 w-[130px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Modelo</span>}
          >
            <Input
              value={p.modelo}
              onChange={(e) => setP({ ...p, modelo: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-10 w-[260px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Fase</span>}
          >
            <Input
              value={p.fase}
              onChange={(e) => setP({ ...p, fase: e.target.value })}
              className="h-10 w-[130px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={<span className="text-[18px] text-[#0A0A0A]">Serial</span>}
          >
            <Input
              value={p.serial}
              onChange={(e) => setP({ ...p, serial: e.target.value })}
              className="h-10 w-[200px] text-[13px] bg-white rounded-md"
            />
          </Field>
          <Field
            label={
              <span className="text-[18px] text-[#0A0A0A]">
                Linha Solicitante
              </span>
            }
          >
            <Select
              value={p.linha || "all"}
              onValueChange={(v) => setP({ ...p, linha: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-[240px] text-[13px] bg-white rounded-md">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>

                {LINHAS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="w-full flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#0fa468] px-4 text-[18px] font-semibold text-white hover:bg-[#0c8756] whitespace-nowrap"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-8 items-center text-[18px] text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface LegacyProps {
  tab: "stencil" | "placas";
  stencilFilters: StencilFilters;
  placaFilters: PlacaFilters;
  onApplyStencil: (f: StencilFilters) => void;
  onApplyPlaca: (f: PlacaFilters) => void;
}

export function FilterPopover(props: LegacyProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FilterTrigger open={open} onToggle={() => setOpen((v) => !v)} />
      {open && <FilterPanel {...props} />}
    </>
  );
}
