import { useMemo, useState, type ReactNode } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Pagination } from "@/components/dashboard/Pagination";
import { StencilTable } from "@/components/dashboard/StencilTable";
import { PlacaTable } from "@/components/dashboard/PlacaTable";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  StencilFilters,
  PlacaFilters,
  emptyStencilFilters,
  emptyPlacaFilters,
} from "@/components/dashboard/FilterPopover";
import type { PlacaWash, StencilWash } from "@/data/mockWashes";

const PAGE_SIZE = 10;

function toTimestamp(data: string, hora: string) {
  const [dia, mes, ano] = data.split("/").map(Number);
  const [horaNum, min] = hora.split(":").map(Number);
  return new Date(ano, mes - 1, dia, horaNum, min).getTime();
}

function sortByDate<T extends { data: string; hora: string }>(rows: T[], direction: "asc" | "desc") {
  return [...rows].sort((a, b) =>
    direction === "asc"
      ? toTimestamp(a.data, a.hora) - toTimestamp(b.data, b.hora)
      : toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora),
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

const History = () => {
  const { data } = useDashboardData(60_000);
  const [assetType, setAssetType] = useState<"stencil" | "placa">("stencil");
  const [stencilFilters, setStencilFilters] = useState<StencilFilters>(emptyStencilFilters);
  const [placaFilters, setPlacaFilters] = useState<PlacaFilters>(emptyPlacaFilters);
  const [appliedStencilFilters, setAppliedStencilFilters] = useState<StencilFilters>(emptyStencilFilters);
  const [appliedPlacaFilters, setAppliedPlacaFilters] = useState<PlacaFilters>(emptyPlacaFilters);
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSearch = () => {
    setAppliedStencilFilters(stencilFilters);
    setAppliedPlacaFilters(placaFilters);
    setPage(1);
  };

  const filteredStencils = useMemo(() => {
    return sortByDate(
      data.stencils.filter((row) => {
        if (appliedStencilFilters.codigo && !row.codigo.toLowerCase().includes(appliedStencilFilters.codigo.toLowerCase())) return false;
        if (
          appliedStencilFilters.idFabricante &&
          !(row.idFabricante ?? "").toLowerCase().includes(appliedStencilFilters.idFabricante.toLowerCase())
        )
          return false;
        if (appliedStencilFilters.pais && !(row.pais ?? "").toLowerCase().includes(appliedStencilFilters.pais.toLowerCase())) return false;
        if (appliedStencilFilters.status && row.motivo !== appliedStencilFilters.status) return false;
        if (appliedStencilFilters.linha && !row.linha.toLowerCase().includes(appliedStencilFilters.linha.toLowerCase())) return false;
        return true;
      }),
      sortDirection,
    );
  }, [data.stencils, appliedStencilFilters, sortDirection]);

  const filteredPlacas = useMemo(() => {
    return sortByDate(
      data.placas.filter((row) => {
        if (appliedPlacaFilters.modelo && !row.modelo.toLowerCase().includes(appliedPlacaFilters.modelo.toLowerCase())) return false;
        if (appliedPlacaFilters.blankId && !(row.codigoBarras ?? "").toLowerCase().includes(appliedPlacaFilters.blankId.toLowerCase())) return false;
        if (appliedPlacaFilters.serial && !(row.serial ?? "").toLowerCase().includes(appliedPlacaFilters.serial.toLowerCase())) return false;
        if (appliedPlacaFilters.linha && !row.linha.toLowerCase().includes(appliedPlacaFilters.linha.toLowerCase())) return false;
        return true;
      }),
      sortDirection,
    );
  }, [data.placas, appliedPlacaFilters, sortDirection]);

  const pageCount = Math.max(1, Math.ceil((assetType === "stencil" ? filteredStencils.length : filteredPlacas.length) / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const rows = assetType === "stencil" ? filteredStencils : filteredPlacas;
    return rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [assetType, filteredStencils, filteredPlacas, page]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Consulta de ativos</p>
                <h1 className="text-2xl font-semibold text-foreground">Histórico de Lavagens</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="default" size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                >
                  Ordem {sortDirection === "asc" ? "Crescente" : "Decrescente"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <Field label="Tipo de ativo">
                <Select value={assetType} onValueChange={(value) => setAssetType(value as "stencil" | "placa") }>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stencil">Stencil</SelectItem>
                    <SelectItem value="placa">Placa</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid gap-4 lg:grid-cols-2">
                {assetType === "stencil" ? (
                  <>
                    <Field label="Código">
                      <Input
                        value={stencilFilters.codigo}
                        onChange={(event) => setStencilFilters({ ...stencilFilters, codigo: event.target.value })}
                      />
                    </Field>
                    <Field label="ID Fabricante">
                      <Input
                        value={stencilFilters.idFabricante}
                        onChange={(event) => setStencilFilters({ ...stencilFilters, idFabricante: event.target.value })}
                      />
                    </Field>
                    <Field label="País origem">
                      <Input
                        value={stencilFilters.pais}
                        onChange={(event) => setStencilFilters({ ...stencilFilters, pais: event.target.value })}
                      />
                    </Field>
                    <Field label="Status">
                      <Select
                        value={stencilFilters.status || "all"}
                        onValueChange={(value) =>
                          setStencilFilters({ ...stencilFilters, status: value === "all" ? "" : value })
                        }
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
                    <Field label="Linha">
                      <Input
                        value={stencilFilters.linha}
                        onChange={(event) => setStencilFilters({ ...stencilFilters, linha: event.target.value })}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Modelo">
                      <Input
                        value={placaFilters.modelo}
                        onChange={(event) => setPlacaFilters({ ...placaFilters, modelo: event.target.value })}
                      />
                    </Field>
                    <Field label="Blank ID">
                      <Input
                        value={placaFilters.blankId}
                        onChange={(event) => setPlacaFilters({ ...placaFilters, blankId: event.target.value })}
                      />
                    </Field>
                    <Field label="Serial">
                      <Input
                        value={placaFilters.serial}
                        onChange={(event) => setPlacaFilters({ ...placaFilters, serial: event.target.value })}
                      />
                    </Field>
                    <Field label="Linha solicitante">
                      <Input
                        value={placaFilters.linha}
                        onChange={(event) => setPlacaFilters({ ...placaFilters, linha: event.target.value })}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
              {assetType === "stencil" ? (
                <StencilTable rows={pageRows as StencilWash[]} selectedId={undefined} onSelect={() => {}} />
              ) : (
                <PlacaTable rows={pageRows as PlacaWash[]} selectedId={undefined} onSelect={() => {}} />
              )}
            </div>
            <Pagination page={page} totalPages={pageCount} onChange={setPage} variant={assetType === "placa" ? "placas" : "stencil"} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default History;
