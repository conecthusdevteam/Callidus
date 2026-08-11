import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StencilTable } from "@/components/dashboard/StencilTable";
import { PlacaTable } from "@/components/dashboard/PlacaTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { WashNotification } from "@/components/dashboard/WashNotification";
import { useDashboardData } from "@/hooks/useDashboardData";
import { isWashOutsideStandardSchedule } from "@/data/mockWashes";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";
import {
  FilterTrigger,
  FilterPanel,
  type StencilFilters,
  type PlacaFilters,
  emptyStencilFilters,
  emptyPlacaFilters,
} from "@/components/dashboard/FilterPopover";
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 9;

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

const Dashboard = () => {
  const { data, newEvents, dismissEvent } = useDashboardData(20_000);

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
  const [filterOpen, setFilterOpen] = useState(false);

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
    <main className="h-full overflow-auto bg-white px-6 py-8 lg:px-8">
      <div className="mx-auto flex min-h-[920px] w-full max-w-[1640px] gap-8">
        <section className="flex min-w-0 flex-1 flex-col gap-8">
          <nav className="flex items-center gap-1 text-[14px] text-[#737373]">
            <span>ISQ</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#0A0A0A]">Home Operação</span>
          </nav>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#15803D] px-5 text-[16px] font-medium text-white transition-colors hover:bg-[#166534]"
            >
              Registrar lavagem
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#F5F5F5] px-5 text-[16px] font-medium text-[#171717] transition-colors hover:bg-[#E5E5E5]"
            >
              Registrar entrega
            </button>
          </div>

          <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <KpiCard
              label={
                <>
                  Lavagens do dia{" "}
                  <span className="font-bold">
                    {new Date().toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </>
              }
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
          </section>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center gap-4">
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
              </div>

              <div className="flex items-center gap-3">
                <FilterTrigger
                  open={filterOpen}
                  onToggle={() => setFilterOpen((v) => !v)}
                />
                {tab === "stencil" && (
                  <div className="inline-flex h-[42px] items-center rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-1 shadow-card">
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
              </div>
            </div>

              <div className={filterOpen ? "block" : "hidden"}>
                <FilterPanel
                  tab={tab}
                  stencilFilters={stencilFilters}
                  placaFilters={placaFilters}
                  onApplyStencil={setStencilFilters}
                  onApplyPlaca={setPlacaFilters}
                />
              </div>

            <div className="min-h-[520px] overflow-auto rounded-lg border border-[#E5E5E5] bg-[#F3F4F6]">
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
          </section>
        </section>

        <aside className="hidden w-[382px] shrink-0 rounded-2xl bg-[#F5F5F5] p-4 xl:flex xl:flex-col">
          <h2 className="text-[20px] font-bold text-[#171717]">
            Stencils em uso
          </h2>
          <div className="flex flex-1 items-center justify-center text-center text-[14px] text-[#737373]">
            Nenhum stencil em uso.
          </div>
        </aside>
      </div>

      <WashNotification
        notifications={newEvents.map((e) => ({ id: e.id, origin: e.origin }))}
        onDismiss={dismissEvent}
      />
    </main>
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

export default Dashboard;
