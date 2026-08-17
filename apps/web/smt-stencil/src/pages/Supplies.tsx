import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Edit3, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/dashboard/Header";
import { PageTabs } from "@/components/dashboard/PageTabs";
import { Pagination } from "@/components/dashboard/Pagination";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StencilDetailsCard } from "@/features/supplies/components/StencilDetailsCard";
import { StencilFormDialog } from "@/features/supplies/components/StencilFormDialog";
import { StencilPreviewDialog } from "@/features/supplies/components/StencilPreviewDialog";
import { PlateDetailsCard } from "@/features/supplies/components/PlateDetailsCard";
import { PlatePreviewDialog } from "@/features/supplies/components/PlatePreviewDialog";
import { SupplyConfirmDialog } from "@/features/supplies/components/SupplyConfirmDialog";
import { SupplySuccessDialog } from "@/features/supplies/components/SupplySuccessDialog";
import {
  emptyPlateFormValues,
  generatePlateCode,
  formValuesToPlatePayload,
  formValuesToPlateSummary,
  hasPlateFormData,
  normalizePlatePhases,
  platePhaseTableLabels,
  plateToFormValues,
  type PlateFormValues,
} from "@/features/supplies/plateRules";
import {
  emptyStencilFormValues,
  formValuesToStencilPayload,
  formValuesToStencilSummary,
  generateStencilCode,
  hasStencilFormData,
  stencilToFormValues,
  type StencilFormValues,
} from "@/features/supplies/stencilRules";
import {
  suppliesApi,
  type HistoryPlateSummary,
  type HistoryStencilSummary,
} from "@/lib/api";

type StencilStatus =
  | "active"
  | "validation"
  | "discarded"
  | "obsolete";

type StencilFilters = {
  codigo: string;
  status: "" | StencilStatus;
  enderecamento: string;
};

type PlateFilters = {
  modelo: string;
  placasPorBlank: string;
  fases: "" | "single_phase" | "two_phases";
};

type SelectedSupply =
  | { type: "stencil"; item: HistoryStencilSummary }
  | { type: "plate"; item: HistoryPlateSummary };

const PAGE_SIZE = 9;

const emptyStencilFilters: StencilFilters = {
  codigo: "",
  status: "",
  enderecamento: "",
};

const emptyPlateFilters: PlateFilters = {
  modelo: "",
  placasPorBlank: "",
  fases: "",
};

const statusLabels: Record<StencilStatus, string> = {
  active: "Ativo",
  validation: "Em validação",
  discarded: "Descartado",
  obsolete: "Obsoleto",
};

const statusClassNames: Record<StencilStatus, string> = {
  active: "border-[#2B8E37] bg-[#BCF0DA]",
  validation: "border-[#FCE96A] bg-[#FCE96A]",
  discarded: "border-[#DB0101] bg-[#FBD5D5]",
  obsolete: "border-[#3F83F8] bg-[#E1EFFE]",
};

function normalizeStatus(status: string): StencilStatus {
  if (status === "active") return status;
  if (status === "validation") return "validation";
  if (status === "discarded") return "discarded";
  if (status === "obsolete") return "obsolete";
  return "validation";
}

function includesText(
  source: string | number | null | undefined,
  query: string,
) {
  if (!query) return true;
  return String(source ?? "")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function getPlateBlankCount(
  plate: HistoryPlateSummary,
  _plates: HistoryPlateSummary[],
) {
  return plate.plates_per_blank ?? 1;
}

function getPlatePhaseKind(
  plate: HistoryPlateSummary,
): "single_phase" | "two_phases" {
  return normalizePlatePhases(plate.phases);
}

function getPlatePhaseLabel(plate: HistoryPlateSummary) {
  return platePhaseTableLabels[getPlatePhaseKind(plate)];
}

function normalizeSupplyCode(code: string) {
  return code.trim().toUpperCase();
}

function getSupplyCodeError({
  code,
  ownType,
  ownId,
  stencils,
  plates,
}: {
  code: string;
  ownType: "stencil" | "plate";
  ownId?: string;
  stencils: HistoryStencilSummary[];
  plates: HistoryPlateSummary[];
}) {
  const normalizedCode = normalizeSupplyCode(code);
  if (!normalizedCode) return "";

  const duplicatedStencil = stencils.find(
    (stencil) =>
      normalizeSupplyCode(stencil.stencilCode) === normalizedCode &&
      !(ownType === "stencil" && stencil.id === ownId),
  );

  if (duplicatedStencil) {
    return "Já existe um stencil cadastrado com este código.";
  }

  const duplicatedPlate = plates.find(
    (plate) =>
      normalizeSupplyCode(plate.plate_model) === normalizedCode &&
      !(ownType === "plate" && plate.id === ownId),
  );

  if (duplicatedPlate) {
    return "Já existe uma placa cadastrada com este código.";
  }

  return "";
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium text-[#0A0A0A]",
        statusClassNames[normalized],
      )}
    >
      {statusLabels[normalized]}
    </span>
  );
}

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-sm font-semibold leading-5 text-muted-foreground">
      {children}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full appearance-none rounded-lg border border-input bg-card px-3 pr-10 text-base shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid h-[432px] place-items-center border-t text-sm text-muted-foreground">
      {message}
    </div>
  );
}

const Supplies = () => {
  const [stencilFilters, setStencilFilters] = useState<StencilFilters>({
    ...emptyStencilFilters,
  });
  const [plateFilters, setPlateFilters] = useState<PlateFilters>({
    ...emptyPlateFilters,
  });
  const [stencilPage, setStencilPage] = useState(1);
  const [platePage, setPlatePage] = useState(1);
  const [selectedSupply, setSelectedSupply] = useState<SelectedSupply | null>(
    null,
  );
  const [stencilFormMode, setStencilFormMode] = useState<
    "create" | "edit" | null
  >(null);
  const [formSupplyType, setFormSupplyType] = useState<"stencil" | "plate">(
    "stencil",
  );
  const [formValues, setFormValues] = useState<StencilFormValues>({
    ...emptyStencilFormValues,
  });
  const [plateFormValues, setPlateFormValues] = useState<PlateFormValues>({
    ...emptyPlateFormValues,
  });
  const [editingStencil, setEditingStencil] =
    useState<HistoryStencilSummary | null>(null);
  const [editingPlate, setEditingPlate] =
    useState<HistoryPlateSummary | null>(null);
  const [previewMode, setPreviewMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [previewValues, setPreviewValues] =
    useState<StencilFormValues | null>(null);
  const [previewPlateValues, setPreviewPlateValues] =
    useState<PlateFormValues | null>(null);
  const [success, setSuccess] = useState<{
    code: string;
    supplyLabel: "Stencil" | "Placa";
    action: "cadastrado" | "atualizado";
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { type: "cancel-create" }
    | { type: "switch-supply"; nextType: "stencil" | "plate" }
    | null
  >(null);
  const queryClient = useQueryClient();

  const stencilsQuery = useQuery({
    queryKey: ["supplies", "stencils"],
    queryFn: () => suppliesApi.getStencils(),
  });

  const platesQuery = useQuery({
    queryKey: ["supplies", "plates"],
    queryFn: () => suppliesApi.getPlates(),
  });

  const stencils = stencilsQuery.data ?? [];
  const plates = platesQuery.data ?? [];

  const filteredStencils = useMemo(
    () =>
      stencils.filter((stencil) => {
        const status = normalizeStatus(stencil.status);
        if (!includesText(stencil.stencilCode, stencilFilters.codigo))
          return false;
        if (stencilFilters.status && status !== stencilFilters.status)
          return false;
        if (!includesText(stencil.eddressing, stencilFilters.enderecamento))
          return false;
        return true;
      }),
    [stencilFilters, stencils],
  );

  const filteredPlates = useMemo(
    () =>
      plates.filter((plate) => {
        const blankCount = getPlateBlankCount(plate, plates);
        if (!includesText(plate.plate_model, plateFilters.modelo)) return false;
        if (!includesText(blankCount, plateFilters.placasPorBlank))
          return false;
        if (
          plateFilters.fases &&
          getPlatePhaseKind(plate) !== plateFilters.fases
        )
          return false;
        return true;
      }),
    [plateFilters, plates],
  );

  useEffect(() => {
    setStencilPage(1);
  }, [stencilFilters]);

  useEffect(() => {
    setPlatePage(1);
  }, [plateFilters]);

  const stencilPages = Math.max(
    1,
    Math.ceil(filteredStencils.length / PAGE_SIZE),
  );
  const platePages = Math.max(1, Math.ceil(filteredPlates.length / PAGE_SIZE));

  const stencilRows = useMemo(
    () =>
      filteredStencils.slice(
        (stencilPage - 1) * PAGE_SIZE,
        stencilPage * PAGE_SIZE,
      ),
    [filteredStencils, stencilPage],
  );

  const plateRows = useMemo(
    () =>
      filteredPlates.slice((platePage - 1) * PAGE_SIZE, platePage * PAGE_SIZE),
    [filteredPlates, platePage],
  );

  const loading = stencilsQuery.isLoading || platesQuery.isLoading;
  const error = stencilsQuery.isError || platesQuery.isError;
  const previewStencil = previewValues
    ? formValuesToStencilSummary(previewValues, editingStencil?.id)
    : null;
  const previewPlate = previewPlateValues
    ? formValuesToPlateSummary(previewPlateValues, editingPlate?.id)
    : null;
  const stencilCodeError = getSupplyCodeError({
    code: generateStencilCode(formValues),
    ownType: "stencil",
    ownId: editingStencil?.id,
    stencils,
    plates,
  });
  const plateCodeError = getSupplyCodeError({
    code: generatePlateCode(plateFormValues),
    ownType: "plate",
    ownId: editingPlate?.id,
    stencils,
    plates,
  });

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 1800);
    return () => window.clearTimeout(timer);
  }, [success]);

  const saveStencilMutation = useMutation({
    mutationFn: async () => {
      if (!previewValues || !previewMode) {
        throw new Error("Dados do stencil não informados.");
      }

      const payload = formValuesToStencilPayload(previewValues);
      if (previewMode === "edit") {
        if (!editingStencil) throw new Error("Stencil não selecionado.");
        return suppliesApi.updateStencil(editingStencil.id, payload);
      }

      return suppliesApi.createStencil(payload);
    },
    onSuccess: async (stencil) => {
      await queryClient.invalidateQueries({ queryKey: ["supplies", "stencils"] });
      setPreviewValues(null);
      setPreviewMode(null);
      setEditingStencil(null);
      setFormValues({ ...emptyStencilFormValues });
      setFormSupplyType("stencil");
      setSuccess({
        code: stencil.stencilCode,
        supplyLabel: "Stencil",
        action: previewMode === "edit" ? "atualizado" : "cadastrado",
      });
    },
  });

  const savePlateMutation = useMutation({
    mutationFn: async () => {
      if (!previewPlateValues || !previewMode) {
        throw new Error("Dados da placa não informados.");
      }

      const payload = formValuesToPlatePayload(previewPlateValues);
      if (previewMode === "edit") {
        if (!editingPlate) throw new Error("Placa não selecionada.");
        return suppliesApi.updatePlate(editingPlate.id, payload);
      }

      return suppliesApi.createPlate(payload);
    },
    onSuccess: async (plate) => {
      await queryClient.invalidateQueries({ queryKey: ["supplies", "plates"] });
      setPreviewPlateValues(null);
      setPreviewMode(null);
      setEditingPlate(null);
      setPlateFormValues({ ...emptyPlateFormValues });
      setFormSupplyType("stencil");
      setSuccess({
        code: plate.plate_model,
        supplyLabel: "Placa",
        action: previewMode === "edit" ? "atualizado" : "cadastrado",
      });
    },
  });

  const openStencilCreate = () => {
    setEditingStencil(null);
    setEditingPlate(null);
    setFormValues({ ...emptyStencilFormValues });
    setPlateFormValues({ ...emptyPlateFormValues });
    setFormSupplyType("stencil");
    setStencilFormMode("create");
  };

  const openStencilEdit = (stencil: HistoryStencilSummary) => {
    setSelectedSupply(null);
    setEditingStencil(stencil);
    setEditingPlate(null);
    setFormValues(stencilToFormValues(stencil));
    setPlateFormValues({ ...emptyPlateFormValues });
    setFormSupplyType("stencil");
    setStencilFormMode("edit");
  };

  const openPlateEdit = (plate: HistoryPlateSummary) => {
    setSelectedSupply(null);
    setEditingStencil(null);
    setEditingPlate(plate);
    setFormValues({ ...emptyStencilFormValues });
    setPlateFormValues(plateToFormValues(plate));
    setFormSupplyType("plate");
    setStencilFormMode("edit");
  };

  const openPreview = (values: StencilFormValues) => {
    setPreviewValues(values);
    setPreviewMode(stencilFormMode);
    setStencilFormMode(null);
  };

  const openPlatePreview = (values: PlateFormValues) => {
    setPreviewPlateValues(values);
    setPreviewMode(stencilFormMode);
    setStencilFormMode(null);
  };

  const closeStencilForm = () => {
    setStencilFormMode(null);
    setEditingStencil(null);
    setEditingPlate(null);
    setFormValues({ ...emptyStencilFormValues });
    setPlateFormValues({ ...emptyPlateFormValues });
    setFormSupplyType("stencil");
  };

  const activeFormHasData =
    formSupplyType === "plate"
      ? hasPlateFormData(plateFormValues)
      : hasStencilFormData(formValues);

  const requestFormCancel = () => {
    if (stencilFormMode === "create" && activeFormHasData) {
      setConfirmAction({ type: "cancel-create" });
      return;
    }

    closeStencilForm();
  };

  const requestSupplyTypeChange = (nextType: "stencil" | "plate") => {
    if (nextType === formSupplyType) return;
    if (activeFormHasData) {
      setConfirmAction({ type: "switch-supply", nextType });
      return;
    }

    setFormSupplyType(nextType);
  };

  const confirmPendingAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "cancel-create") {
      setConfirmAction(null);
      closeStencilForm();
      return;
    }

    setFormValues({ ...emptyStencilFormValues });
    setPlateFormValues({ ...emptyPlateFormValues });
    setFormSupplyType(confirmAction.nextType);
    setConfirmAction(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <PageTabs />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-5 py-3">
          <div className="flex shrink-0 items-center justify-between">
            <Button
              onClick={openStencilCreate}
              className="h-11 rounded-lg bg-[#0B0B0B] px-4 text-base font-medium text-[#FAFAFA] hover:bg-[#27272A]"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Cadastrar insumos
            </Button>
          </div>

          <section className="shrink-0">
            <h1 className="text-[26px] font-bold leading-tight text-[#0A0A0A]">
              Lista de insumos cadastrados
            </h1>
            <p className="mt-2 text-[20px] leading-7 text-muted-foreground">
              Consulte e/ou edite os insumos cadastrados através das listas.
            </p>
          </section>

          {error && (
            <div className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Não foi possível carregar os insumos cadastrados.
            </div>
          )}

          <section className="grid min-h-0 grid-cols-1 gap-10 2xl:grid-cols-[minmax(640px,1.08fr)_minmax(520px,0.9fr)]">
            <div className="min-w-0">
              <div className="mb-8 grid grid-cols-[minmax(180px,2fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto] items-end gap-4">
                <div className="space-y-1.5">
                  <FilterLabel>Código stencil</FilterLabel>
                  <Input
                    value={stencilFilters.codigo}
                    onChange={(event) =>
                      setStencilFilters((current) => ({
                        ...current,
                        codigo: event.target.value,
                      }))
                    }
                    className="h-[52px] rounded-lg bg-card text-base shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <FilterLabel>Status</FilterLabel>
                  <SelectField
                    ariaLabel="Filtrar stencils por status"
                    value={stencilFilters.status}
                    onChange={(value) =>
                      setStencilFilters((current) => ({
                        ...current,
                        status: value as StencilFilters["status"],
                      }))
                    }
                  >
                    <option value="">Todos</option>
                    <option value="validation">Em validação</option>
                    <option value="active">Ativo</option>
                    <option value="discarded">Descartado</option>
                    <option value="obsolete">Obsoleto</option>
                  </SelectField>
                </div>

                <div className="space-y-1.5">
                  <FilterLabel>Endereçamento</FilterLabel>
                  <Input
                    value={stencilFilters.enderecamento}
                    onChange={(event) =>
                      setStencilFilters((current) => ({
                        ...current,
                        enderecamento: event.target.value,
                      }))
                    }
                    className="h-[52px] rounded-lg bg-card text-base shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStencilFilters({ ...emptyStencilFilters })}
                  className="h-[52px] px-3 text-left text-base font-semibold text-[#404040] transition-colors hover:text-foreground"
                >
                  Limpar filtros
                </button>
              </div>

              <StencilSuppliesTable
                loading={loading}
                rows={stencilRows}
                onOpen={(item) => setSelectedSupply({ type: "stencil", item })}
              />
              <Pagination
                page={stencilPage}
                totalPages={stencilPages}
                onChange={setStencilPage}
                variant="stencil"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-8 grid grid-cols-[minmax(200px,2fr)_minmax(120px,0.9fr)_minmax(120px,0.9fr)_auto] items-end gap-4">
                <div className="space-y-1.5">
                  <FilterLabel>Modelo placa</FilterLabel>
                  <Input
                    value={plateFilters.modelo}
                    onChange={(event) =>
                      setPlateFilters((current) => ({
                        ...current,
                        modelo: event.target.value,
                      }))
                    }
                    className="h-[52px] rounded-lg bg-card text-base shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <FilterLabel>Placas por blank</FilterLabel>
                  <Input
                    inputMode="numeric"
                    value={plateFilters.placasPorBlank}
                    onChange={(event) =>
                      setPlateFilters((current) => ({
                        ...current,
                        placasPorBlank: event.target.value,
                      }))
                    }
                    className="h-[52px] rounded-lg bg-card text-base shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <FilterLabel>Fases</FilterLabel>
                  <SelectField
                    ariaLabel="Filtrar placas por fases"
                    value={plateFilters.fases}
                    onChange={(value) =>
                      setPlateFilters((current) => ({
                        ...current,
                        fases: value as PlateFilters["fases"],
                      }))
                    }
                  >
                    <option value="">Todas</option>
                    <option value="single_phase">Fase única</option>
                    <option value="two_phases">2 fases</option>
                  </SelectField>
                </div>

                <button
                  type="button"
                  onClick={() => setPlateFilters({ ...emptyPlateFilters })}
                  className="h-[52px] px-3 text-left text-base font-semibold text-[#404040] transition-colors hover:text-foreground"
                >
                  Limpar filtros
                </button>
              </div>

              <PlateSuppliesTable
                loading={loading}
                rows={plateRows}
                allRows={plates}
                onOpen={(item) => setSelectedSupply({ type: "plate", item })}
              />
              <Pagination
                page={platePage}
                totalPages={platePages}
                onChange={setPlatePage}
                variant="placas"
              />
            </div>
          </section>
        </main>
      </div>

      {selectedSupply && (
        <SupplyDetailsDialog
          selected={selectedSupply}
          onEditStencil={openStencilEdit}
          onEditPlate={openPlateEdit}
          onOpenChange={(open) => {
            if (!open) setSelectedSupply(null);
          }}
        />
      )}
      {stencilFormMode && (
        <StencilFormDialog
          open
          mode={stencilFormMode}
          supplyType={formSupplyType}
          values={formValues}
          plateValues={plateFormValues}
          onValuesChange={setFormValues}
          onPlateValuesChange={setPlateFormValues}
          onCancel={requestFormCancel}
          onPreview={openPreview}
          onPlatePreview={openPlatePreview}
          onSupplyTypeChange={requestSupplyTypeChange}
          stencilCodeError={stencilCodeError}
          plateCodeError={plateCodeError}
        />
      )}
      {previewValues && previewMode && (
        <StencilPreviewDialog
          open
          stencil={previewStencil}
          mode={previewMode}
          saving={saveStencilMutation.isPending}
          onConfirm={() => saveStencilMutation.mutate()}
          onEdit={() => {
            setStencilFormMode(previewMode);
            setFormValues(previewValues);
            setPreviewValues(null);
            setPreviewMode(null);
          }}
          onCancel={() => {
            setPreviewValues(null);
            setPreviewMode(null);
          }}
        />
      )}
      {previewPlateValues && previewMode && (
        <PlatePreviewDialog
          open
          plate={previewPlate}
          mode={previewMode}
          saving={savePlateMutation.isPending}
          onConfirm={() => savePlateMutation.mutate()}
          onEdit={() => {
            setStencilFormMode(previewMode);
            setPlateFormValues(previewPlateValues);
            setPreviewPlateValues(null);
            setPreviewMode(null);
          }}
          onCancel={() => {
            setPreviewPlateValues(null);
            setPreviewMode(null);
          }}
        />
      )}
      <SupplySuccessDialog
        open={success !== null}
        code={success?.code ?? ""}
        supplyLabel={success?.supplyLabel ?? "Stencil"}
        action={success?.action ?? "cadastrado"}
        onOpenChange={(open) => {
          if (!open) setSuccess(null);
        }}
      />
      <SupplyConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "switch-supply"
            ? "Alterar tipo de insumo?"
            : "Cancelar cadastro?"
        }
        description={
          confirmAction?.type === "switch-supply"
            ? "Ao alterar o tipo de insumo, todas as informações inseridas serão descartadas."
            : "Ao cancelar, todas as informações inseridas serão perdidas."
        }
        question={
          confirmAction?.type === "switch-supply"
            ? "Deseja continuar?"
            : "Deseja cancelar o cadastro?"
        }
        cancelLabel={
          confirmAction?.type === "switch-supply"
            ? "Não"
            : "Continuar preenchendo"
        }
        confirmLabel={
          confirmAction?.type === "switch-supply"
            ? "Sim"
            : "Cancelar cadastro"
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
};

function StencilSuppliesTable({
  loading,
  rows,
  onOpen,
}: {
  loading: boolean;
  rows: HistoryStencilSummary[];
  onOpen: (row: HistoryStencilSummary) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-t-lg">
      <div className="grid h-10 grid-cols-[minmax(260px,2fr)_minmax(160px,0.9fr)_minmax(140px,0.9fr)] items-center bg-[#1A56DB] text-[#FAFAFA]">
        <div className="px-2 text-base font-bold">Código stencil</div>
        <div className="px-2 text-base font-bold">Status</div>
        <div className="px-2 text-base font-bold">Endereçamento</div>
      </div>

      {loading ? (
        <EmptyState message="Carregando stencils..." />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhum stencil encontrado." />
      ) : (
        <div>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row)}
              className="grid h-12 w-full grid-cols-[minmax(260px,2fr)_minmax(160px,0.9fr)_minmax(140px,0.9fr)] items-center border-b border-[#E5E5E5] text-left text-base text-[#0A0A0A] transition-colors hover:bg-muted/70 focus:bg-muted focus:outline-none"
            >
              <div className="truncate px-2">{row.stencilCode}</div>
              <div className="px-2">
                <StatusBadge status={row.status} />
              </div>
              <div className="px-2">{row.eddressing}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlateSuppliesTable({
  loading,
  rows,
  allRows,
  onOpen,
}: {
  loading: boolean;
  rows: HistoryPlateSummary[];
  allRows: HistoryPlateSummary[];
  onOpen: (row: HistoryPlateSummary) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-t-lg">
      <div className="grid h-10 grid-cols-[minmax(260px,2fr)_minmax(150px,0.8fr)_minmax(140px,0.8fr)] items-center bg-[#0EA36F] text-[#FAFAFA]">
        <div className="px-2 text-base font-bold">Modelo placa</div>
        <div className="px-2 text-base font-bold">Placas por blank</div>
        <div className="px-2 text-base font-bold">Fases</div>
      </div>

      {loading ? (
        <EmptyState message="Carregando placas..." />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhuma placa encontrada." />
      ) : (
        <div>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row)}
              className="grid h-12 w-full grid-cols-[minmax(260px,2fr)_minmax(150px,0.8fr)_minmax(140px,0.8fr)] items-center border-b border-[#E5E5E5] text-left text-base text-[#0A0A0A] transition-colors hover:bg-muted/70 focus:bg-muted focus:outline-none"
            >
              <div className="truncate px-2">{row.plate_model}</div>
              <div className="px-2">{getPlateBlankCount(row, allRows)}</div>
              <div className="px-2">{getPlatePhaseLabel(row)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SupplyDetailsDialog({
  selected,
  onEditStencil,
  onEditPlate,
  onOpenChange,
}: {
  selected: SelectedSupply | null;
  onEditStencil: (stencil: HistoryStencilSummary) => void;
  onEditPlate: (plate: HistoryPlateSummary) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={selected !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(860px,calc(100vw-48px))] max-w-none rounded-xl bg-card p-8">
        <DialogHeader className="pr-48">
          <div className="absolute right-20 top-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selected?.type === "stencil") onEditStencil(selected.item);
                if (selected?.type === "plate") onEditPlate(selected.item);
              }}
              className="h-10 rounded-md px-4 text-sm font-semibold"
            >
              <Edit3 aria-hidden="true" className="h-4 w-4" />
              Editar informações
            </Button>
          </div>
          <DialogTitle className="text-[26px] font-bold leading-tight text-[#0A0A0A]">
            {selected?.type === "plate"
              ? "Consulta de Placa"
              : "Consulta de Stencil"}
          </DialogTitle>
          <DialogDescription className="text-[20px] leading-7 text-muted-foreground">
            Consulte e/ou edite os dados de um{" "}
            {selected?.type === "plate" ? "modelo de placa." : "stencil."}
          </DialogDescription>
        </DialogHeader>

        {selected?.type === "plate" ? (
          <PlateDetailsCard plate={selected.item} />
        ) : selected?.type === "stencil" ? (
          <StencilDetailsCard stencil={selected.item} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default Supplies;
