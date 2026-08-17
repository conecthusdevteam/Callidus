import type { HistoryPlateSummary, UpsertPlatePayload } from "@/lib/api";

export type PlatePhaseKind = "single_phase" | "two_phases";

export interface PlateFormValues {
  model: string;
  plateType: string;
  phases: PlatePhaseKind | "";
  platesPerBlank: string;
}

export const emptyPlateFormValues: PlateFormValues = {
  model: "",
  plateType: "",
  phases: "",
  platesPerBlank: "",
};

export const platePhaseLabels: Record<PlatePhaseKind, string> = {
  single_phase: "Fase única",
  two_phases: "F1, F2",
};

export const platePhaseTableLabels: Record<PlatePhaseKind, string> = {
  single_phase: "Fase única",
  two_phases: "2 fases",
};

export function generatePlateCode(values: PlateFormValues) {
  return [formatCodeSegment(values.model), formatCodeSegment(values.plateType)]
    .filter(Boolean)
    .join("_");
}

export function getPlateFormErrors(values: PlateFormValues) {
  const errors: Partial<Record<keyof PlateFormValues, string>> = {};

  if (!values.model.trim()) errors.model = "Obrigatório";
  if (!values.plateType.trim()) errors.plateType = "Obrigatório";
  if (!values.phases) errors.phases = "Obrigatório";

  const platesPerBlank = Number(values.platesPerBlank);
  if (!values.platesPerBlank.trim()) {
    errors.platesPerBlank = "Obrigatório";
  } else if (!Number.isInteger(platesPerBlank) || platesPerBlank < 1) {
    errors.platesPerBlank = "Informe um número inteiro positivo";
  }

  return errors;
}

export function hasPlateFormData(values: PlateFormValues) {
  return Object.values(values).some((value) => value.trim().length > 0);
}

export function plateToFormValues(plate: HistoryPlateSummary): PlateFormValues {
  return {
    model: (plate.model ?? splitPlateCode(plate.plate_model).model).toUpperCase(),
    plateType: (
      plate.plate_type ?? splitPlateCode(plate.plate_model).plateType
    ).toUpperCase(),
    phases: normalizePlatePhases(plate.phases),
    platesPerBlank: String(plate.plates_per_blank ?? 1),
  };
}

export function formValuesToPlatePayload(
  values: PlateFormValues,
): UpsertPlatePayload {
  return {
    plateModel: generatePlateCode(values),
    model: values.model.trim().toUpperCase(),
    plateType: values.plateType.trim().toUpperCase(),
    phases: values.phases as PlatePhaseKind,
    platesPerBlank: Number(values.platesPerBlank),
  };
}

export function formValuesToPlateSummary(
  values: PlateFormValues,
  id = "preview",
): HistoryPlateSummary {
  return {
    id,
    plate_model: generatePlateCode(values),
    model: values.model.trim().toUpperCase(),
    plate_type: values.plateType.trim().toUpperCase(),
    phases: values.phases || "two_phases",
    plates_per_blank: Number(values.platesPerBlank) || 1,
    serial: "",
    blank_id: "",
    line: "",
    manufacturer_id: null,
    origin_country: null,
    thickness: null,
    addressing: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_washes: 0,
    last_wash: null,
    last_wash_details: null,
  };
}

export function normalizePlatePhases(value?: string | null): PlatePhaseKind {
  return value === "single_phase" ? "single_phase" : "two_phases";
}

function splitPlateCode(code: string) {
  const [model = "", plateType = ""] = code.split("_");
  return { model, plateType };
}

function formatCodeSegment(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}
