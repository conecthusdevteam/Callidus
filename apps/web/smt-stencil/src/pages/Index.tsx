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
  type StencilFilters,
  type PlacaFilters,
  emptyStencilFilters,
  emptyPlacaFilters,
} from "@/components/dashboard/FilterPopover";

const PAGE_SIZE = 9;

function formatSyncLabel(lastUpdate: Date): string {
  const diffMin = Math.floor((Date.now() - lastUpdate.getTime()) / 60_000);
  if (diffMin < 1) return "agora";
  return `há ${diffMin} min`;
}

function toTimestamp(data: string, hora: string): number {
  const [dia, mes, ano] = data.split("/").map(Number);
  const [h, m] = hora.split(":").map(Number);
  return new Date(ano, mes - 1, dia, h, m).getTime();
}

function sortByDate<T extends { data: string; hora: string }>(
  rows: T[],
  direction: "asc" | "desc",
): T[] {
  return [...rows].sort((a, b) =>
    direction === "asc"
      ? toTimestamp(a.data, a.hora) - toTimestamp(b.data, b.hora)
      : toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora),
  );
}

const Index = () => {
  const { data, lastUpdate, newEvents, dismissEvent } =
    useDashboardData(60_000);

  const [tab, setTab] = useState<"stencil" | "placas">("stencil");
  const [showAttention, setShowAttention] = useState(false);
  const [stencilPage, setStencilPage] = useState(1);
  const [placaPage, setPlacaPage] = useState(1);
  const [selected, setSelected] = useState<StencilWash | PlacaWash | null>(
    null,
  );
  const [stencilFilters, setStencilFilters] =
    useState<StencilFilters>(emptyStencilFilters);
  const [placaFilters, setPlacaFilters] =
    useState<PlacaFilters>(emptyPlacaFilters);
  const [tableSort, setTableSort] = useState<{
    stencil: "asc" | "desc";
    placas: "asc" | "desc";
  }>({
    stencil: "desc",
    placas: "desc",
  });
  const [syncLabel, setSyncLabel] = useState(() => formatSyncLabel(lastUpdate));

  useEffect(() => {
    setSyncLabel(formatSyncLabel(lastUpdate));
    const id = window.setInterval(
      () => setSyncLabel(formatSyncLabel(lastUpdate)),
      60_000,
    );
    return () => window.clearInterval(id);
  }, [lastUpdate]);

  useEffect(() => {
    setStencilPage(1);
  }, [showAttention, stencilFilters, tableSort.stencil]);
  useEffect(() => {
    setPlacaPage(1);
  }, [placaFilters, tableSort.placas]);

  const filteredStencils = useMemo(
    () =>
      data.stencils.filter((row) => {
        if (showAttention && !isWashOutsideStandardSchedule(row.hora))
          return false;
        if (
          stencilFilters.codigo &&
          !row.codigo
            .toLowerCase()
            .includes(stencilFilters.codigo.toLowerCase())
        )
          return false;
        if (
          stencilFilters.idFabricante &&
          !(row.idFabricante ?? "")
            .toLowerCase()
            .includes(stencilFilters.idFabricante.toLowerCase())
        )
          return false;
        if (
          stencilFilters.pais &&
          !(row.pais ?? "")
            .toLowerCase()
            .includes(stencilFilters.pais.toLowerCase())
        )
          return false;
        if (stencilFilters.status && row.motivo !== stencilFilters.status)
          return false;
        return true;
      }),
    [data.stencils, showAttention, stencilFilters],
  );

  const filteredPlacas = useMemo(
    () =>
      data.placas.filter((row) => {
        if (
          placaFilters.modelo &&
          !row.modelo.toLowerCase().includes(placaFilters.modelo.toLowerCase())
        )
          return false;
        if (
          placaFilters.blankId &&
          !(row.codigoBarras ?? "")
            .toLowerCase()
            .includes(placaFilters.blankId.toLowerCase())
        )
          return false;
        if (
          placaFilters.serial &&
          !(row.serial ?? "")
            .toLowerCase()
            .includes(placaFilters.serial.toLowerCase())
        )
          return false;
        if (
          placaFilters.linha &&
          !row.linha.toLowerCase().includes(placaFilters.linha.toLowerCase())
        )
          return false;
        return true;
      }),
    [data.placas, placaFilters],
  );

  const stencilPages = Math.max(
    1,
    Math.ceil(filteredStencils.length / PAGE_SIZE),
  );
  const stencilRows = useMemo(
    () =>
      sortByDate(filteredStencils, tableSort.stencil).slice(
        (stencilPage - 1) * PAGE_SIZE,
        stencilPage * PAGE_SIZE,
      ),
    [filteredStencils, stencilPage, tableSort.stencil],
  );

  const placaPages = Math.max(1, Math.ceil(filteredPlacas.length / PAGE_SIZE));
  const placaRows = useMemo(
    () =>
      sortByDate(filteredPlacas, tableSort.placas).slice(
        (placaPage - 1) * PAGE_SIZE,
        placaPage * PAGE_SIZE,
      ),
    [filteredPlacas, placaPage, tableSort.placas],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />

        <main className="flex flex-1 flex-col overflow-hidden min-w-0 w-full px-4 py-3 gap-3">
          {/* ── KPIs ── */}
          <section className="flex gap-3 shrink-0">
            <KpiCard
              label="Lavagens do dia"
              value={data.totalDia}
              variant="primary"
            />
            <KpiCard
              label="Lavagens de Stencil"
              value={data.totalStencil}
              variant="neutral"
            />
            <KpiCard
              label="Lavagens de Placas"
              value={data.totalPlacas}
              variant="neutral"
            />
            <KpiCard
              label="Última coleta de dados"
              value={syncLabel}
              variant="attention"
            />
            <SupplyStatusKpi status={data.status} />
          </section>

          {/* ── Linha principal: tabela + coluna lateral ── */}
          <section className="flex flex-1 gap-4 overflow-hidden min-h-0 min-w-0 w-full">
            {/* Coluna da tabela — flex-1 + min-w-0 para encolher corretamente */}
            <div className="flex flex-1 flex-col overflow-hidden min-h-0 min-w-0">
              {/* Barra de controles */}
              <div className="mb-2 flex items-center justify-between gap-3 shrink-0 min-w-0">
                <div className="inline-flex rounded-lg border bg-card p-1 shadow-card shrink-0">
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

                <div className="flex flex-1 justify-center px-2 min-w-0 overflow-hidden">
                  <WashNotification
                    notifications={newEvents.map((e) => ({
                      id: e.id,
                      origin: e.origin,
                    }))}
                    onDismiss={dismissEvent}
                    isInline
                    currentTab={tab}
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
                    onApplyStencil={setStencilFilters}
                    onApplyPlaca={setPlacaFilters}
                  />
                </div>
              </div>

              {/* Tabela — cresce até preencher, scroll interno */}
              <div className="flex-1 overflow-auto min-h-0 min-w-0 rounded-lg border bg-card">
                {tab === "stencil" ? (
                  <StencilTable
                    rows={stencilRows}
                    selectedId={selected?.id}
                    onSelect={setSelected}
                    sort={tableSort.stencil}
                    onToggleSort={() =>
                      setTableSort((p) => ({
                        ...p,
                        stencil: p.stencil === "asc" ? "desc" : "asc",
                      }))
                    }
                  />
                ) : (
                  <PlacaTable
                    rows={placaRows}
                    selectedId={selected?.id}
                    onSelect={setSelected}
                    sort={tableSort.placas}
                    onToggleSort={() =>
                      setTableSort((p) => ({
                        ...p,
                        placas: p.placas === "asc" ? "desc" : "asc",
                      }))
                    }
                  />
                )}
              </div>

              {/* Paginação */}
              <div className="shrink-0">
                {tab === "stencil" ? (
                  <Pagination
                    page={stencilPage}
                    totalPages={stencilPages}
                    onChange={setStencilPage}
                    variant="stencil"
                  />
                ) : (
                  <Pagination
                    page={placaPage}
                    totalPages={placaPages}
                    onChange={setPlacaPage}
                    variant="placas"
                  />
                )}
              </div>
            </div>

            {/* Coluna lateral — largura fixa, não encolhe */}
            <aside className="relative w-[500px] shrink-0 flex flex-col gap-4 overflow-hidden min-h-0 mt-16">
              {/* Placeholders sempre presentes */}
              <div className="flex-1 rounded-xl bg-[#E5E7EB] min-h-0" />
              <div className="flex-1 rounded-xl bg-[#E5E7EB] min-h-0" />

              {/* Card flutuante de detalhes — sobrepõe os placeholders quando há seleção */}
              {selected && (
                <div className="absolute w-[350px] inset-0 overflow-y-auto rounded-xl">
                  <DetailsPanel
                    item={selected}
                    onClose={() => setSelected(null)}
                  />
                </div>
              )}
            </aside>
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
      type="button"
      onClick={onClick}
      data-active={active}
      className={`tab-pill ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export default Index;
