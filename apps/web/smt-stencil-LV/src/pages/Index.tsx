import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StencilTable } from "@/components/dashboard/StencilTable";
import { PlacaTable } from "@/components/dashboard/PlacaTable";
import { DetailsPanel } from "@/components/dashboard/DetailsPanel";
import { SystemStatusCard } from "@/components/dashboard/SystemStatusCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

const PAGE_SIZE = 10;

const Index = () => {
  const { data } = useDashboardData(60_000);
  const [tab, setTab] = useState<"stencil" | "placas">("stencil");
  const [showAttention, setShowAttention] = useState(false);
  const [stencilPage, setStencilPage] = useState(1);
  const [placaPage, setPlacaPage] = useState(1);
  const [selected, setSelected] = useState<StencilWash | PlacaWash | null>(null);

  // Reset paginação ao alternar filtro de atenção.
  useEffect(() => {
    setStencilPage(1);
  }, [showAttention]);

  const stencilFiltered = useMemo(
    () => (showAttention ? data.stencils.filter((s) => s.attention) : data.stencils),
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
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          {/* KPIs RP-01 */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard label="Lavagens do dia" value={data.totalDia} variant="primary" />
            <KpiCard label="Lavagens de Stencil" value={data.totalStencil} variant="neutral" />
            <KpiCard label="Lavagens de Placas" value={data.totalPlacas} variant="neutral" />
            <KpiCard
              label="Última coleta de dados"
              value={data.ultimaSyncLabel}
              variant="attention"
            />
          </section>

          {/* Tabs + filtros */}
          <section className="mt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-lg border bg-card p-1 shadow-card">
                    <TabButton active={tab === "stencil"} onClick={() => { setTab("stencil"); setSelected(null); }}>
                      Stencil
                    </TabButton>
                    <TabButton active={tab === "placas"} onClick={() => { setTab("placas"); setSelected(null); }}>
                      Placas
                    </TabButton>
                  </div>

                  <div className="flex min-h-10 items-center justify-end">
                    {tab === "stencil" && (
                      <div className="inline-flex rounded-lg border bg-card p-1 shadow-card">
                        <TabButton active={!showAttention} onClick={() => setShowAttention(false)}>
                          Todos
                        </TabButton>
                        <TabButton active={showAttention} onClick={() => setShowAttention(true)}>
                          Itens de Atenção
                        </TabButton>
                      </div>
                    )}
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
                    />
                  </>
                )}

              </div>

            {/* Coluna lateral: DetailsPanel + SystemStatusCard ancorado logo abaixo (img1) */}
            <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <DetailsPanel item={selected} onClose={() => setSelected(null)} />
              <SystemStatusCard status={data.status} />
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default Index;