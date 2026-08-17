import type { HistoryStencilSummary, UpsertStencilPayload } from "@/lib/api";

export type StencilPhase = "1F" | "2F" | "FU";
export type StencilApproval = "ok" | "fail";
export type StencilTechnicalOpinion = "approved" | "rejected";
export type StencilStatus =
  | "validation"
  | "active"
  | "obsolete"
  | "discarded";

export interface StencilFormValues {
  plateModel: string;
  plateType: string;
  version: string;
  phase: StencilPhase | "";
  country: string;
  manufactureId: string;
  copy: string;
  thickness: string;
  manufacturedAt: string;
  addressing: string;
  status: StencilStatus;
  serigraphy: StencilApproval | "";
  fiducials: StencilApproval | "";
  finishing: StencilApproval | "";
  technicalOpinion: StencilTechnicalOpinion | "";
}

export const emptyStencilFormValues: StencilFormValues = {
  plateModel: "",
  plateType: "",
  version: "",
  phase: "",
  country: "",
  manufactureId: "",
  copy: "",
  thickness: "",
  manufacturedAt: "",
  addressing: "",
  status: "validation",
  serigraphy: "",
  fiducials: "",
  finishing: "",
  technicalOpinion: "",
};

export const stencilStatusLabels: Record<StencilStatus, string> = {
  validation: "Em validação",
  active: "Ativo",
  obsolete: "Obsoleto",
  discarded: "Descartado",
};

export const stencilStatusColors: Record<
  StencilStatus,
  { backgroundColor: string; borderColor: string }
> = {
  validation: { backgroundColor: "#FCE96A", borderColor: "#FACA15" },
  active: { backgroundColor: "#BCF0DA", borderColor: "#2B8E37" },
  obsolete: { backgroundColor: "#E1EFFE", borderColor: "#3F83F8" },
  discarded: { backgroundColor: "#FBD5D5", borderColor: "#DB0101" },
};

export const approvalLabels: Record<StencilApproval, string> = {
  ok: "Ok",
  fail: "Falha",
};

export const technicalOpinionLabels: Record<StencilTechnicalOpinion, string> = {
  approved: "Aprovado",
  rejected: "Reprovado",
};

export function isChina(country: string) {
  return country.trim().toLowerCase() === "china";
}

export function generateStencilCode(values: StencilFormValues) {
  const plateModel = formatCodeSegment(values.plateModel);
  const plateType = formatCodeSegment(values.plateType);
  const version = formatCodeSegment(values.version);
  const phase = formatCodeSegment(values.phase);
  const manufactureId = isChina(values.country)
    ? "CHINA"
    : formatCodeSegment(values.manufactureId);
  const copy = formatCodeSegment(values.copy);

  const segments = [
    plateModel,
    plateType,
    version ? `V${version}` : "",
    phase,
    manufactureId,
  ].filter(Boolean);

  const code = segments.join("_");
  return copy ? `${code}/${copy}` : code;
}

export function getStencilFormErrors(values: StencilFormValues) {
  const errors: Partial<Record<keyof StencilFormValues, string>> = {};

  if (!values.plateModel.trim()) errors.plateModel = "Obrigatório";
  if (!values.plateType.trim()) errors.plateType = "Obrigatório";
  if (!values.phase) errors.phase = "Obrigatório";
  if (!values.country.trim()) errors.country = "Obrigatório";
  if (!isChina(values.country) && !values.manufactureId.trim()) {
    errors.manufactureId = "Obrigatório";
  }
  if (!values.thickness.trim()) errors.thickness = "Obrigatório";
  if (!values.manufacturedAt.trim()) errors.manufacturedAt = "Obrigatório";
  if (!values.addressing.trim()) errors.addressing = "Obrigatório";
  if (!values.serigraphy) errors.serigraphy = "Obrigatório";
  if (!values.fiducials) errors.fiducials = "Obrigatório";
  if (!values.finishing) errors.finishing = "Obrigatório";
  if (!values.technicalOpinion) errors.technicalOpinion = "Obrigatório";

  return errors;
}

export function hasStencilFormData(values: StencilFormValues) {
  return Object.entries(values).some(([key, value]) => {
    if (key === "status") return value !== emptyStencilFormValues.status;
    return String(value ?? "").trim().length > 0;
  });
}

export function hasSectionErrors(
  errors: Partial<Record<keyof StencilFormValues, string>>,
  fields: Array<keyof StencilFormValues>,
) {
  return fields.some((field) => Boolean(errors[field]));
}

export function stencilToFormValues(
  stencil: HistoryStencilSummary,
): StencilFormValues {
  return {
    plateModel: (stencil.plate_model ?? "").toUpperCase(),
    plateType: (stencil.plate_type ?? "").toUpperCase(),
    version: (stencil.version ?? "").toUpperCase(),
    phase: stencil.phase ?? "",
    country: stencil.country ?? "",
    manufactureId: isChina(stencil.country)
      ? ""
      : (stencil.manufacture_id ?? "").toUpperCase(),
    copy: (stencil.copy ?? "").toUpperCase(),
    thickness: String(stencil.thickness ?? ""),
    manufacturedAt: toInputDate(stencil.manufactured_at ?? stencil.created_at),
    addressing: String(stencil.eddressing ?? "").toUpperCase(),
    status: normalizeStencilStatus(stencil.status),
    serigraphy: stencil.serigraphy ?? "",
    fiducials: stencil.fiducials ?? "",
    finishing: stencil.finishing ?? "",
    technicalOpinion: stencil.technical_opinion ?? "",
  };
}

export function formValuesToStencilPayload(
  values: StencilFormValues,
): UpsertStencilPayload {
  return {
    plateModel: values.plateModel.trim().toUpperCase(),
    plateType: values.plateType.trim().toUpperCase(),
    version: values.version.trim().toUpperCase() || undefined,
    phase: values.phase as StencilPhase,
    country: values.country.trim(),
    manufactureId: isChina(values.country)
      ? undefined
      : values.manufactureId.trim().toUpperCase(),
    copy: values.copy.trim().toUpperCase() || undefined,
    thickness: Number(values.thickness),
    manufacturedAt: values.manufacturedAt,
    addressing: values.addressing.trim().toUpperCase(),
    status: normalizeStencilStatus(values.status),
    serigraphy: values.serigraphy as StencilApproval,
    fiducials: values.fiducials as StencilApproval,
    finishing: values.finishing as StencilApproval,
    technicalOpinion: values.technicalOpinion as StencilTechnicalOpinion,
  };
}

export function formValuesToStencilSummary(
  values: StencilFormValues,
  id = "preview",
): HistoryStencilSummary {
  return {
    id,
    stencilCode: generateStencilCode(values),
    plate_model: values.plateModel.trim().toUpperCase() || null,
    plate_type: values.plateType.trim().toUpperCase() || null,
    version: values.version.trim().toUpperCase() || null,
    phase: (values.phase || null) as HistoryStencilSummary["phase"],
    copy: values.copy.trim().toUpperCase() || null,
    manufacture_id: isChina(values.country)
      ? "CHINA"
      : values.manufactureId.toUpperCase(),
    country: values.country,
    thickness: Number(values.thickness) || 0,
    eddressing: Number(values.addressing) || 0,
    manufactured_at: values.manufacturedAt || null,
    serigraphy: (values.serigraphy || "ok") as HistoryStencilSummary["serigraphy"],
    fiducials: (values.fiducials || "ok") as HistoryStencilSummary["fiducials"],
    finishing: (values.finishing || "ok") as HistoryStencilSummary["finishing"],
    technical_opinion: (values.technicalOpinion ||
      "approved") as HistoryStencilSummary["technical_opinion"],
    status: normalizeStencilStatus(values.status),
    line_name: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_washes: 0,
    last_wash: null,
    last_wash_details: null,
    mid_range: null,
    anomaly: false,
  };
}

function formatCodeSegment(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function toInputDate(value: string | null) {
  if (!value) return "";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeStencilStatus(status: string): StencilStatus {
  if (
    status === "validation" ||
    status === "active" ||
    status === "obsolete" ||
    status === "discarded"
  ) {
    return status;
  }

  return "validation";
}
