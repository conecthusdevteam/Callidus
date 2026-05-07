import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SupplyStatusKpi } from "@/components/dashboard/SupplyStatusKpi";
import { StencilTable } from "@/components/dashboard/StencilTable";
import { PlacaTable } from "@/components/dashboard/PlacaTable";
import { DetailsPanel } from "@/components/dashboard/DetailsPanel";
import { Pagination } from "@/components/dashboard/Pagination";
import { WashNotification } from "@/components/dashboard/WashNotification";
import { useDashboardData } from "@/hooks/useDashboardData";
import { isWashOutsideStandardSchedule } from "@/data/mockWashes";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";
import {
  FilterPopover,
  StencilFilters,
  PlacaFilters,
  emptyStencilFilters,
  emptyPlacaFilters,
} from "@/components/dashboard/FilterPopover";

function formatSyncLabel(lastUpdate: Date) {
  const diffMinutes = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
  return `há ${Math.max(diffMinutes, 0)} min`;
}

const PAGE_SIZE = 10;

const Index = () => {
  const { data, lastUpdate, newEvents, dismissEvent } = useDashboardData(60_000);
  const [tab, setTab] = useState<"stencil" | "placas">("stencil");
  const [showAttention, setShowAttention] = useState(false);
  const [stencilPage, setStencilPage] = useState(1);
  const [placaPage, setPlacaPage] = useState(1);
  const [selected, setSelected] = useState<StencilWash | PlacaWash | null>(null);
  const [stencilFilters, setStencilFilters] = useState<StencilFilters>(emptyStencilFilters);
  const [placaFilters, setPlacaFilters] = useState<PlacaFilters>(emptyPlacaFilters);
  const [tableSort, setTableSort] = useState<{ stencil: "asc" | "desc"; placas: "asc" | "desc" }>(
    {
      stencil: "desc",
      placas: "desc",
    },
  );
  const [syncLabel, setSyncLabel] = useState(() => formatSyncLabel(lastUpdate));

  useEffect(() => {
    setSyncLabel(formatSyncLabel(lastUpdate));
    
    const intervalId = window.setInterval(() => {
      setSyncLabel(formatSyncLabel(lastUpdate));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [lastUpdate]);

  // Reset paginação ao alternar filtro, ordem ou atenção.
  useEffect(() => {
    setStencilPage(1);
  }, [showAttention, stencilFilters, tableSort.stencil]);

  useEffect(() => {
    setPlacaPage(1);
  }, [placaFilters, tableSort.placas]);

  const toTimestamp = (data: string, hora: string) => {
    const [dia, mes, ano] = data.split("/").map(Number);
    const [horaNum, min] = hora.split(":").map(Number);
    return new Date(ano, mes - 1, dia, horaNum, min).getTime();
  };

  const sortByDate = <T extends { data: string; hora: string }>(rows: T[], direction: "asc" | "desc") =>
    [...rows].sort((a, b) =>
      direction === "asc"
        ? toTimestamp(a.data, a.hora) - toTimestamp(b.data, b.hora)
        : toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora),
    );

  const filteredStencils = useMemo(() => {
    return data.stencils
      .filter((row) => !showAttention || isWashOutsideStandardSchedule(row.hora))
      .filter((row) => {
        if (stencilFilters.codigo && !row.codigo.toLowerCase().includes(stencilFilters.codigo.toLowerCase())) return false;
        if (stencilFilters.idFabricante && !(row.idFabricante ?? "").toLowerCase().includes(stencilFilters.idFabricante.toLowerCase())) return false;
        if (stencilFilters.pais && !(row.pais ?? "").toLowerCase().includes(stencilFilters.pais.toLowerCase())) return false;
        if (stencilFilters.status && row.motivo !== stencilFilters.status) return false;
        return true;
      });
  }, [data.stencils, showAttention, stencilFilters]);

  const stencilPages = Math.max(1, Math.ceil(filteredStencils.length / PAGE_SIZE));
  const stencilRows = useMemo(
    () => sortByDate(filteredStencils, tableSort.stencil).slice((stencilPage - 1) * PAGE_SIZE, stencilPage * PAGE_SIZE),
    [filteredStencils, stencilPage, tableSort.stencil],
  );

  const filteredPlacas = useMemo(() => {
    return data.placas.filter((row) => {
      if (placaFilters.modelo && !row.modelo.toLowerCase().includes(placaFilters.modelo.toLowerCase())) return false;
      if (placaFilters.blankId && !(row.codigoBarras ?? "").toLowerCase().includes(placaFilters.blankId.toLowerCase())) return false;
      if (placaFilters.serial && !(row.serial ?? "").toLowerCase().includes(placaFilters.serial.toLowerCase())) return false;
      if (placaFilters.linha && !row.linha.toLowerCase().includes(placaFilters.linha.toLowerCase())) return false;
      return true;
    });
  }, [data.placas, placaFilters]);

  const placaPages = Math.max(1, Math.ceil(filteredPlacas.length / PAGE_SIZE));
  const placaRows = useMemo(
    () => sortByDate(filteredPlacas, tableSort.placas).slice((placaPage - 1) * PAGE_SIZE, placaPage * PAGE_SIZE),
    [filteredPlacas, placaPage, tableSort.placas],
  );

  return (
    <div className="flex min-h-screen bg-background">
      <WashNotification
        notifications={newEvents.map((e) => ({ id: e.id, origin: e.origin }))}
        onDismiss={dismissEvent}
      />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          {/* KPIs RP-01 — agora 5 cards (inclui "Fornecimento de dados") */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            <KpiCard label="Lavagens do dia" value={data.totalDia} variant="primary" />
            <KpiCard label="Lavagens de Stencil" value={data.totalStencil} variant="neutral" />
            <KpiCard label="Lavagens de Placas" value={data.totalPlacas} variant="neutral" />
            <KpiCard
              label="Última coleta de dados"
              value={syncLabel}
              variant="attention"
            />
            <SupplyStatusKpi status={data.status} />
          </section>

          {/* Tabs + filtros */}
          <section className="mt-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-lg border bg-card p-1 shadow-card">
                    <TabButton
                      active={tab === "stencil"}
                      onClick={() => {
                        setTab("stencil");
                        setSelected(null);
                      }}
                      className="tab-pill--stencil"
                    >
                      Stencil
                    </TabButton>
                    <TabButton
                      active={tab === "placas"}
                      onClick={() => {
                        setTab("placas");
                        setSelected(null);
                      }}
                      className="tab-pill--placa"
                    >
                      Placas
                    </TabButton>
                  </div>

                  <div className="flex min-h-10 items-center justify-end gap-3">
                    {tab === "stencil" && (
                      <div className="inline-flex rounded-lg border bg-card p-1 shadow-card">
                        <TabButton
                          active={!showAttention}
                          onClick={() => setShowAttention(false)}
                          className="tab-pill--filter"
                        >
                          Todos
                        </TabButton>
                        <TabButton
                          active={showAttention}
                          onClick={() => setShowAttention(true)}
                          className="tab-pill--filter"
                        >
                          Itens de Atenção
                        </TabButton>
                      </div>
                    )}
                    <FilterPopover
                      tab={tab}
                      stencilFilters={stencilFilters}
                      placaFilters={placaFilters}
                      onApplyStencil={(filters) => setStencilFilters(filters)}
                      onApplyPlaca={(filters) => setPlacaFilters(filters)}
                    />
                  </div>
                </div>
                {tab === "stencil" ? (
                  <>
                    <StencilTable
                      rows={stencilRows}
                      selectedId={selected?.id}
                      onSelect={setSelected}
                      sort={tableSort.stencil}
                      onToggleSort={() =>
                        setTableSort((prev) => ({
                          ...prev,
                          stencil: prev.stencil === "asc" ? "desc" : "asc",
                        }))
                      }
                    />
                    <Pagination
                      page={stencilPage}
                      totalPages={stencilPages}
                      onChange={setStencilPage}
                      variant="stencil"
                    />
                  </>
                ) : (
                  <>
                    <PlacaTable
                      rows={placaRows}
                      selectedId={selected?.id}
                      onSelect={setSelected}
                      sort={tableSort.placas}
                      onToggleSort={() =>
                        setTableSort((prev) => ({
                          ...prev,
                          placas: prev.placas === "asc" ? "desc" : "asc",
                        }))
                      }
                    />
                    <Pagination
                      page={placaPage}
                      totalPages={placaPages}
                      onChange={setPlacaPage}
                      variant="placas"
                    />
                  </>
                )}

              </div>

              {/* Coluna lateral: alinha com o TOPO da tabela (img2), não do bloco de tabs */}
              <aside className="lg:sticky lg:top-4 lg:self-start">
                {/* Spacer com altura idêntica à barra de tabs+filtros (botões h-[34px] + p-1 + mb-3 = 12px) */}
                <div aria-hidden className="hidden lg:block" style={{ height: "calc(2.125rem + 0.5rem + 0.75rem)" }} />
                <div className="space-y-4">
                  <DetailsPanel item={selected} onClose={() => setSelected(null)} />
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

function TabButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className={`tab-pill ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export default Index;