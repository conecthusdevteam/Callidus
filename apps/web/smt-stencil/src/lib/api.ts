const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Simulação ────────────────────────────────────────────────────────────────

type SimTarget = "sgs" | "clp" | "both" | null;

function getSimFail(): SimTarget {
  try {
    const v = window.localStorage.getItem("smt-sim-fail");
    if (v === "sgs" || v === "clp" || v === "both") return v;
  } catch {
    // ignore
  }
  return null;
}

// ── Request base ─────────────────────────────────────────────────────────────

async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
  });

  // 404 do NestJS significa lista vazia — não é falha de sistema
  if (response.status === 404) {
    return [] as unknown as T;
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ── APIs públicas ─────────────────────────────────────────────────────────────

export const stencilsApi = {
  getAll: async (): Promise<ApiStencil[]> => {
    const sim = getSimFail();
    if (sim === "sgs" || sim === "both") {
      throw new Error("[SIMULAÇÃO] SGS indisponível");
    }
    return apiRequest<ApiStencil[]>("/stencils");
  },
};

export const platesApi = {
  getAll: async (): Promise<ApiPlate[]> => {
    const sim = getSimFail();
    if (sim === "clp" || sim === "both") {
      throw new Error("[SIMULAÇÃO] CLP indisponível");
    }
    return apiRequest<ApiPlate[]>("/plates");
  },
};

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const historyApi = {
  getStencils: async (
    filters: HistoryStencilFilters = {},
  ): Promise<HistoryStencilSummary[]> =>
    apiRequest<HistoryStencilSummary[]>(
      `/stencils${buildQuery({
        stencilCode: filters.codigo,
        manufactureId: filters.idFabricante,
        country: filters.pais,
        status: filters.status,
        lineName: filters.linha,
      })}`,
    ),

  getStencil: async (id: string): Promise<HistoryStencilDetail> =>
    apiRequest<HistoryStencilDetail>(`/stencils/${id}`),

  getPlates: async (
    filters: HistoryPlateFilters = {},
  ): Promise<HistoryPlateSummary[]> =>
    apiRequest<HistoryPlateSummary[]>(
      `/plates${buildQuery({
        plate_model: filters.modelo,
        blank_id: filters.blankId,
        serial: filters.serial,
        line: filters.linha,
      })}`,
    ),

  getPlate: async (id: string): Promise<HistoryPlateDetail> =>
    apiRequest<HistoryPlateDetail>(`/plates/${id}`),

  getLines: async (): Promise<string[]> =>
    apiRequest<string[]>("/stencils/lines"),
};

// ── Shapes exatos que o back entrega ─────────────────────────────────────────

export interface ApiStencil {
  id: string;
  stencilCode: string;
  manufactureId: string;
  country: string;
  thickness: number;
  addressing: number;
  totalWashes: number;
  operator: string;
  lineName: string;
  status: "active" | "inactive";
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ApiPlate {
  id: string;
  plateModel: string;
  serialNumber: string;
  blankId: string;
  shift: number;
  phase: number;
  totalWashes: number;
  operator: string;
  lineName: string;
  plateManufacturerId?: string;
  country?: string;
  thickness?: number;
  addressing?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryStencilFilters {
  codigo?: string;
  idFabricante?: string;
  pais?: string;
  status?: string;
  linha?: string;
}

export interface HistoryPlateFilters {
  modelo?: string;
  blankId?: string;
  serial?: string;
  linha?: string;
}

export interface HistoryStencilWash {
  id: string;
  operator: string;
  created_at: string;
  previous_wash_interval: number | null;
  non_standard: boolean;
}

export interface HistoryStencilSummary {
  id: string;
  stencilCode: string;
  manufacture_id: string;
  country: string;
  thickness: number;
  eddressing: number;
  status: "active" | "inactive";
  line_name: string;
  created_at: string;
  updated_at: string;
  total_washes: number;
  last_wash: string | null;
  last_wash_details: HistoryStencilWash | null;
  mid_range: number | null;
  anomaly: boolean;
}

export interface HistoryStencilDetail extends HistoryStencilSummary {
  washes_history: HistoryStencilWash[];
}

export interface HistoryPlateWash {
  id: string;
  operator: string;
  shift: number;
  phase: number;
  created_at: string;
}

export interface HistoryPlateSummary {
  id: string;
  plate_model: string;
  serial: string;
  blank_id: string;
  line: string;
  manufacturer_id: string | null;
  origin_country: string | null;
  thickness: number | null;
  addressing: string | null;
  created_at: string;
  updated_at: string;
  total_washes: number;
  last_wash: string | null;
  last_wash_details: HistoryPlateWash | null;
}

export interface HistoryPlateDetail extends HistoryPlateSummary {
  washes_history: HistoryPlateWash[];
}
