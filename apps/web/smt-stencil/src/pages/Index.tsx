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
import filterIcon from "@/assets/icon-filter.svg";

function formatSyncLabel(lastUpdate: Date) {
  const diffMinutes = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
  return diffMinutes <= 0 ? "agora" : `há ${diffMinutes} min`;
}

const PAGE_SIZE = 10;

const Index = () => {
  const { data, lastUpdate, newEvents, dismissEvent } = useDashboardData(60_000);
  const [tab, setTab] = useState<"stencil" | "placas">("stencil");
  const [showAttention, setShowAttention] = useState(false);
  const [stencilPage, setStencilPage] = useState(1);
  const [placaPage, setPlacaPage] = useState(1);
  const [selected, setSelected] = useState<StencilWash | PlacaWash | null>(null);
  const [syncLabel, setSyncLabel] = useState(() => formatSyncLabel(lastUpdate));

  useEffect(() => {
    setSyncLabel(formatSyncLabel(lastUpdate));
    
    const intervalId = window.setInterval(() => {
      setSyncLabel(formatSyncLabel(lastUpdate));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [lastUpdate]);

  // Reset paginação ao alternar filtro de atenção.
  useEffect(() => {
    setStencilPage(1);
  }, [showAttention]);

  const stencilFiltered = useMemo(
    () => (showAttention ? data.stencils.filter((s) => isWashOutsideStandardSchedule(s.hora)) : data.stencils),
    [data.stencils, showAttention],
  );

  const stencilPages = Math.max(1, Math.ceil(stencilFiltered.length / PAGE_SIZE));
  const stencilRows = useMemo(
    () => stencilFiltered.slice((stencilPage - 1) * PAGE_SIZE, stencilPage * PAGE_SIZE),
    [stencilFiltered, stencilPage],
  );

  const placaPages = Math.max(1, Math.ceil(data.placas.length / PAGE_SIZE));
  const placaRows = useMemo(
    () => data.placas.slice((placaPage - 1) * PAGE_SIZE, placaPage * PAGE_SIZE),
    [data.placas, placaPage],
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
                    <button
                      type="button"
                      className="inline-flex  h-12 items-center gap-2 rounded-lg border bg-card px-3 
                      text-sm font-medium text-foreground shadow-card transition-colors hover:bg-muted"
                    >
                      <img src={filterIcon} alt="" className="h-4 w-4" />
                      Filtrar
                    </button>
                  </div>
                </div>
                {tab === "stencil" ? (
                  <>
                    <StencilTable
                      rows={stencilRows}
                      selectedId={selected?.id}
                      onSelect={setSelected}
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