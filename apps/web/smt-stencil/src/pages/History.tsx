import { Header } from "@/components/dashboard/Header";
import { Pagination } from "@/components/dashboard/Pagination";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { StatusPill } from "../components/dashboard/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApiPlate,
  ApiStencil,
  HistoryPlateFilters,
  HistoryStencilFilters,
} from "@/lib/api";
import { historyApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AssetType = "stencil" | "placa";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 9;

const emptyStencilFilters: HistoryStencilFilters = {
  codigo: "",
  idFabricante: "",
  pais: "",
  status: "",
  linha: "",
};

const emptyPlateFilters: HistoryPlateFilters = {
  modelo: "",
  blankId: "",
  serial: "",
  linha: "",
};

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Manaus",
  }).format(new Date(iso));
}

function formatTime(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Manaus",
  }).format(new Date(iso));
}

function sortByWashDate<T extends { created_at: string }>(
  rows: T[],
  direction: SortDirection,
) {
  return [...rows].sort((a, b) => {
    const first = new Date(a.created_at).getTime();
    const second = new Date(b.created_at).getTime();
    return direction === "asc" ? first - second : second - first;
  });
}

function DetailMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[19px] font-bold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ConsultButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-7 gap-1 rounded-md border-[#cfd6dd] px-3 text-[12px] font-medium"
    >
      <Search className="h-3.5 w-3.5" />
      Consultar
    </Button>
  );
}

function AssetTypeSelect({
  value,
  onChange,
}: {
  value: AssetType;
  onChange: (value: AssetType) => void;
}) {
  return (
    <Field label="Tipo de ativo">
      <Select
        value={value}
        onValueChange={(next) => onChange(next as AssetType)}
      >
        <SelectTrigger className="h-10 w-[148px] rounded-md bg-white text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="stencil">Stencil</SelectItem>
          <SelectItem value="placa">Placa</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function StencilFiltersForm({
  filters,
  lines,
  onChange,
  onSearch,
}: {
  filters: HistoryStencilFilters;
  lines: string[];
  onChange: (filters: HistoryStencilFilters) => void;
  onSearch: () => void;
}) {
  return (
    <div className="grid items-end gap-4 lg:grid-cols-[1.45fr_1fr_1fr_1fr_1fr_auto]">
      <Field label="Código">
        <Input
          value={filters.codigo}
          onChange={(event) =>
            onChange({ ...filters, codigo: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="ID Fabricante">
        <Input
          value={filters.idFabricante}
          onChange={(event) =>
            onChange({ ...filters, idFabricante: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="País origem">
        <Input
          value={filters.pais}
          onChange={(event) =>
            onChange({ ...filters, pais: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Status">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, status: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Linha">
        <Select
          value={filters.linha || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, linha: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {lines.map((line) => (
              <SelectItem key={line} value={line}>
                {line}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button
        type="button"
        onClick={onSearch}
        className="h-10 gap-2 rounded-md bg-[#1d5be3] px-5 text-[13px] font-semibold hover:bg-[#1749b6]"
      >
        <Search className="h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
}

function PlateFiltersForm({
  filters,
  lines,
  onChange,
  onSearch,
}: {
  filters: HistoryPlateFilters;
  lines: string[];
  onChange: (filters: HistoryPlateFilters) => void;
  onSearch: () => void;
}) {
  return (
    <div className="grid items-end gap-3 lg:grid-cols-[1.45fr_1fr_1fr_1fr_auto]">
      <Field label="Modelo">
        <Input
          value={filters.modelo}
          onChange={(event) =>
            onChange({ ...filters, modelo: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Blank ID">
        <Input
          value={filters.blankId}
          onChange={(event) =>
            onChange({ ...filters, blankId: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Serial">
        <Input
          value={filters.serial}
          onChange={(event) =>
            onChange({ ...filters, serial: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Linha solicitante">
        <Select
          value={filters.linha || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, linha: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {lines.map((line) => (
              <SelectItem key={line} value={line}>
                {line}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button
        type="button"
        onClick={onSearch}
        className="h-10 gap-2 rounded-md bg-[#0fa468] px-5 text-[13px] font-semibold hover:bg-[#0c8756]"
      >
        <Search className="h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
}

function StencilTable({
  rows,
  sort,
  onToggleSort,
  onConsult,
}: {
  rows: ApiStencil[];
  sort: SortDirection;
  onToggleSort: () => void;
  onConsult: (row: ApiStencil) => void;
}) {
  return (
    <div className="min-h-0 overflow-auto rounded-t-md">
      <table className="w-full min-w-[600px] border-collapse text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1d55d8] text-left text-white">
            <th className="w-[160px] px-2 py-1.5 font-bold">
              <button
                type="button"
                onClick={onToggleSort}
                className="table-head-cell w-full flex items-center justify-between text-left"
              >
                <span>Data</span>

                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="table-head-cell px-4 text-left">Hora</th>
            <th className="table-head-cell px-4 text-left">Código</th>
            <th className="table-head-cell px-4 text-left">Endereç.</th>
            <th className="table-head-cell px-4 text-left">Status</th>
            <th className="table-head-cell px-4 text-left">Linha</th>
            <th className="table-head-cell px-4 text-left" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={cn(
                index % 2 === 0 ? "bg-white" : "bg-[#E5E5E5]",
                row.non_standard && "bg-red-50 shadow-[inset_4px_0_0_#ef4444]",
              )}
            >
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                {formatDate(row.created_at)}
              </td>
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                {formatTime(row.created_at)}
              </td>
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                {row.stencil_code}
              </td>
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                {String(row.addressing ?? "").padStart(3, "0")}
              </td>
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                <StatusPill
                  status={row.status === "active" ? "Ativo" : "Inativo"}
                />
              </td>
              <td className="px-4 py-4 text-[16px] tabular text-foreground">
                {row.line_name}
              </td>
              <td className="px-3 py-2 text-center">
                <ConsultButton onClick={() => onConsult(row)} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="bg-white px-3 py-10 text-center text-muted-foreground"
              >
                Nenhum stencil encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlateTable({
  rows,
  sort,
  onToggleSort,
  onConsult,
}: {
  rows: ApiPlate[];
  sort: SortDirection;
  onToggleSort: () => void;
  onConsult: (row: ApiPlate) => void;
}) {
  return (
    <div className="min-h-0 overflow-auto rounded-t-md">
      <table className="w-full min-w-[860px] border-collapse text-lg font-normal">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#0fa468] text-left text-white">
            <th className="w-[160px] px-2 py-1.5 font-bold">
              <button
                type="button"
                onClick={onToggleSort}
                className="table-head-cell w-full flex items-center justify-between text-left"
              >
                <span>Data</span>

                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="w-[90px] px-3 py-2 font-bold">Hora</th>
            <th className="w-[70px] px-3 py-2 font-bold">Modelo</th>
            <th className="w-[150px] px-3 py-2 font-bold">Serial</th>
            <th className="w-[150px] px-3 py-2 font-bold">Blank ID</th>
            <th className="w-[170px] px-3 py-2 font-bold">Linha solicitante</th>
            <th className="w-[130px] px-3 py-2 font-bold" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={index % 2 === 0 ? "bg-white" : "bg-[#E5E5E5]"}
            >
              <td className="px-3 py-3 tabular">
                {formatDate(row.created_at)}
              </td>
              <td className="px-3 py-3 tabular">
                {formatTime(row.created_at)}
              </td>
              <td className="px-3 py-3 font-medium">{row.plate_model}</td>
              <td className="px-3 py-3 tabular">{row.serial}</td>
              <td className="px-3 py-3 tabular">{row.blank_id}</td>
              <td className="px-3 py-3">{row.line}</td>
              <td className="px-3 py-2 text-center">
                <ConsultButton onClick={() => onConsult(row)} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="bg-white px-3 py-10 text-center text-muted-foreground"
              >
                Nenhuma placa encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StencilDetailsModal({
  detail,
  loading,
  open,
  onOpenChange,
}: {
  detail: ApiStencil | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-[790px] overflow-y-auto rounded-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Informações detalhadas do stencil</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between pr-8">
            <h2 className="text-[17px] font-bold">Informações detalhadas</h2>
          </div>

          {loading || !detail ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando histórico...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-[1.65fr_0.55fr_0.55fr_0.65fr_0.8fr]">
                <DetailMetric
                  label="Código Stencil"
                  value={detail.stencil_code}
                />
                <DetailMetric
                  label="Endereçamento"
                  value={String(detail.addressing ?? "").padStart(3, "0")}
                />
                <DetailMetric
                  label="Espessura"
                  value={
                    detail.asset?.thickness != null
                      ? Number(detail.asset.thickness).toFixed(2)
                      : "-"
                  }
                />
                <DetailMetric
                  label="ID Fabricante"
                  value={detail.asset?.manufacture_id || "-"}
                />
                <DetailMetric
                  label="País de Origem"
                  value={detail.asset?.country || "-"}
                />
              </div>

              <DetailMetric
                label="Total de Lavagens Registradas"
                value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
                className="mt-5"
              />

              <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_0.9fr]">
                <div className="rounded-md border bg-white p-4">
                  <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                    Dados da lavagem
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <DetailMetric
                      label="ID Lavagem"
                      value={detail.id}
                      className="col-span-3"
                    />
                    <DetailMetric
                      label="Data"
                      value={formatDate(detail.created_at)}
                    />
                    <DetailMetric
                      label="Hora"
                      value={formatTime(detail.created_at)}
                    />
                    <DetailMetric
                      label="Operador de Lavagem"
                      value={detail.operator || "-"}
                    />
                  </div>
                </div>
                <div className="rounded-md border bg-white p-4">
                  <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                    Dados de produção
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Estimativa
                  </p>
                  <p className="mt-1 text-[19px] font-bold">
                    0 placas produzidas
                  </p>
                </div>
              </div>

              <div className="mt-6 h-[245px] rounded-xl bg-[#d9d9d9]" />
              <div className="mt-4 h-[72px] rounded-xl bg-[#d9d9d9]" />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlateDetailsModal({
  detail,
  loading,
  open,
  onOpenChange,
}: {
  detail: ApiPlate | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-[790px] overflow-y-auto rounded-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Informações detalhadas da placa</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between pr-8">
            <h2 className="text-[17px] font-bold">Informações detalhadas</h2>
          </div>

          {loading || !detail ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando histórico...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr]">
                <DetailMetric label="Modelo" value={detail.plate_model} />
                <DetailMetric label="Serial" value={detail.serial} />
                <DetailMetric label="Blank ID" value={detail.blank_id} />
                <DetailMetric label="Linha" value={detail.line} />
              </div>

              <DetailMetric
                label="Total de Lavagens Registradas"
                value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
                className="mt-5"
              />

              <div className="mt-4 rounded-md border bg-white p-4">
                <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                  Dados da lavagem
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <DetailMetric
                    label="ID Lavagem"
                    value={detail.id}
                    className="col-span-3"
                  />
                  <DetailMetric
                    label="Data"
                    value={formatDate(detail.created_at)}
                  />
                  <DetailMetric
                    label="Hora"
                    value={formatTime(detail.created_at)}
                  />
                  <DetailMetric label="Turno" value={detail.shift} />
                  <DetailMetric
                    label="Operador de Lavagem"
                    value={detail.operator || "-"}
                  />
                </div>
              </div>

              <div className="mt-6 h-[245px] rounded-xl bg-[#d9d9d9]" />
              <div className="mt-4 h-[72px] rounded-xl bg-[#d9d9d9]" />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const History = () => {
  const [assetType, setAssetType] = useState<AssetType>("stencil");
  const [stencilFilters, setStencilFilters] =
    useState<HistoryStencilFilters>(emptyStencilFilters);
  const [plateFilters, setPlateFilters] =
    useState<HistoryPlateFilters>(emptyPlateFilters);
  const [stencils, setStencils] = useState<ApiStencil[]>([]);
  const [plates, setPlates] = useState<ApiPlate[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [sort, setSort] = useState<SortDirection>("desc");
  const [stencilPage, setStencilPage] = useState(1);
  const [platePage, setPlatePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStencil, setSelectedStencil] = useState<ApiStencil | null>(
    null,
  );
  const [selectedPlate, setSelectedPlate] = useState<ApiPlate | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailType, setDetailType] = useState<AssetType | null>(null);

  const sortedStencils = useMemo(
    () => sortByWashDate(stencils, sort),
    [stencils, sort],
  );
  const sortedPlates = useMemo(
    () => sortByWashDate(plates, sort),
    [plates, sort],
  );
  const stencilPages = Math.max(
    1,
    Math.ceil(sortedStencils.length / PAGE_SIZE),
  );
  const platePages = Math.max(1, Math.ceil(sortedPlates.length / PAGE_SIZE));
  const stencilRows = useMemo(
    () =>
      sortedStencils.slice(
        (stencilPage - 1) * PAGE_SIZE,
        stencilPage * PAGE_SIZE,
      ),
    [sortedStencils, stencilPage],
  );
  const plateRows = useMemo(
    () =>
      sortedPlates.slice((platePage - 1) * PAGE_SIZE, platePage * PAGE_SIZE),
    [sortedPlates, platePage],
  );

  const loadRows = async () => {
    setLoading(true);
    setError("");

    try {
      if (assetType === "stencil") {
        setStencils(await historyApi.getStencilWashes(stencilFilters));
        setStencilPage(1);
      } else {
        setPlates(await historyApi.getPlateWashes(plateFilters));
        setPlatePage(1);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao buscar histórico.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    historyApi
      .getLines()
      .then(setLines)
      .catch(() => setLines([]));
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType]);

  useEffect(() => {
    setStencilPage(1);
    setPlatePage(1);
  }, [sort]);

  const openStencil = (row: ApiStencil) => {
    setDetailType("stencil");
    setSelectedStencil(row);
    setDetailsLoading(false);
  };

  const openPlate = (row: ApiPlate) => {
    setDetailType("placa");
    setSelectedPlate(row);
    setDetailsLoading(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden px-4 pr-[310px] py-3">
          <section className="shrink-0">
            <h1 className="text-[24px] mt-5 font-bold leading-tight">
              Histórico de Lavagens
            </h1>
            <p className="mt-1 text-[18px] text-muted-foreground">
              Adicione uma ou mais informações para filtrar.
            </p>

            <div className="mt-4 grid gap-3">
              <AssetTypeSelect
                value={assetType}
                onChange={(value) => {
                  setAssetType(value);
                  setError("");
                }}
              />
              {assetType === "stencil" ? (
                <StencilFiltersForm
                  filters={stencilFilters}
                  lines={lines}
                  onChange={setStencilFilters}
                  onSearch={loadRows}
                />
              ) : (
                <PlateFiltersForm
                  filters={plateFilters}
                  lines={lines}
                  onChange={setPlateFilters}
                  onSearch={loadRows}
                />
              )}
            </div>
          </section>

          {error && (
            <div className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="min-h-0 min-w-0 flex-1 overflow-auto">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Carregando histórico...
                </div>
              ) : assetType === "stencil" ? (
                <StencilTable
                  rows={stencilRows}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onConsult={openStencil}
                />
              ) : (
                <PlateTable
                  rows={plateRows}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onConsult={openPlate}
                />
              )}
            </div>

            <div className="shrink-0">
              {assetType === "stencil" ? (
                <Pagination
                  page={stencilPage}
                  totalPages={stencilPages}
                  onChange={setStencilPage}
                  variant="stencil"
                />
              ) : (
                <Pagination
                  page={platePage}
                  totalPages={platePages}
                  onChange={setPlatePage}
                  variant="placas"
                />
              )}
            </div>
          </section>
        </main>
      </div>

      <StencilDetailsModal
        open={
          detailType === "stencil" &&
          (detailsLoading || Boolean(selectedStencil))
        }
        loading={detailsLoading}
        detail={selectedStencil}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStencil(null);
            setDetailType(null);
          }
        }}
      />
      <PlateDetailsModal
        open={
          detailType === "placa" && (detailsLoading || Boolean(selectedPlate))
        }
        loading={detailsLoading}
        detail={selectedPlate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlate(null);
            setDetailType(null);
          }
        }}
      />
    </div>
  );
};

export default History;
