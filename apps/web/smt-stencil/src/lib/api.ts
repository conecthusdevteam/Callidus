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
    const washesResponse = await apiRequest<ApiTodayStencilWashesResponse>(
      "/stencils/washes/today?limit=100",
    );
    return withTodayStencilCountsAndAnomalies(
      getPaginatedRows(washesResponse).map(normalizeTodayStencilWash),
    );
  },
};

export const platesApi = {
  getAll: async (): Promise<ApiPlate[]> => {
    const sim = getSimFail();
    if (sim === "clp" || sim === "both") {
      throw new Error("[SIMULAÇÃO] CLP indisponível");
    }
    const washesResponse = await apiRequest<ApiTodayPlateWashesResponse>(
      "/plates/washes/today?limit=100",
    );
    return withTodayPlateCounts(
      getPaginatedRows(washesResponse).map(normalizeTodayPlateWash),
    );
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

  getStencilWashes: async (
    filters: HistoryStencilFilters = {},
  ): Promise<ApiStencil[]> => {
    const [washesResponse, stencils] = await Promise.all([
      apiRequest<ApiPaginatedResponse<ApiStencil>>(
        "/stencils/washes?limit=100",
      ),
      apiRequest<HistoryStencilSummary[]>("/stencils"),
    ]);
    const stencilsById = new Map(stencils.map((stencil) => [stencil.id, stencil]));

    return washesResponse.items
      .map((wash) => ({
        ...wash,
        asset: stencilsById.get(wash.stencil_id),
      }))
      .filter((wash) => {
        const asset = wash.asset;
        if (
          filters.codigo &&
          !wash.stencil_code.toLowerCase().includes(filters.codigo.toLowerCase())
        )
          return false;
        if (
          filters.idFabricante &&
          !(asset?.manufacture_id ?? "")
            .toLowerCase()
            .includes(filters.idFabricante.toLowerCase())
        )
          return false;
        if (
          filters.pais &&
          !(asset?.country ?? "")
            .toLowerCase()
            .includes(filters.pais.toLowerCase())
        )
          return false;
        if (filters.status && wash.status !== filters.status) return false;
        if (filters.linha && wash.line_name !== filters.linha) return false;
        return true;
      });
  },

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

  getPlateWashes: async (
    filters: HistoryPlateFilters = {},
  ): Promise<ApiPlate[]> => {
    const [washesResponse, plates] = await Promise.all([
      apiRequest<ApiPaginatedResponse<ApiPlate>>("/plates/washes?limit=100"),
      apiRequest<HistoryPlateSummary[]>("/plates"),
    ]);
    const platesById = new Map(plates.map((plate) => [plate.id, plate]));

    return washesResponse.items
      .map((wash) => ({
        ...wash,
        asset: platesById.get(wash.plate_id),
      }))
      .filter((wash) => {
        if (
          filters.modelo &&
          !wash.plate_model.toLowerCase().includes(filters.modelo.toLowerCase())
        )
          return false;
        if (
          filters.blankId &&
          !wash.blank_id.toLowerCase().includes(filters.blankId.toLowerCase())
        )
          return false;
        if (
          filters.serial &&
          !wash.serial.toLowerCase().includes(filters.serial.toLowerCase())
        )
          return false;
        if (filters.linha && wash.line !== filters.linha) return false;
        return true;
      });
  },

  getLines: async (): Promise<string[]> =>
    apiRequest<string[]>("/stencils/lines"),
};

// ── Shapes exatos que o back entrega ─────────────────────────────────────────

export interface ApiPaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

type ApiTodayResponse<T> =
  | ApiPaginatedResponse<T>
  | {
      data: T[];
      meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
    };

function getPaginatedRows<T>(response: ApiTodayResponse<T>): T[] {
  return "items" in response ? response.items : response.data;
}

type ApiTodayStencilWashesResponse = ApiTodayResponse<ApiTodayStencilWash>;
type ApiTodayPlateWashesResponse = ApiTodayResponse<ApiTodayPlateWash>;

interface ApiTodayStencilWash {
  id: string;
  stencilId: string;
  operator: string;
  createdAt: string;
  stencil: {
    id: string;
    stencilCode: string;
    manufactureId: string;
    country: string;
    thickness: number;
    addressing: number;
    status: "active" | "inactive";
    lineName: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ApiTodayPlateWash {
  id: string;
  plateId: string;
  operator: string;
  shift: number;
  phase: number;
  createdAt: string;
  plate: {
    id: string;
    plateModel: string;
    serialNumber: string;
    blankId: string;
    lineName: string;
    plateManufacturerId?: string | null;
    country?: string | null;
    thickness?: number | null;
    addressing?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

function normalizeTodayStencilWash(wash: ApiTodayStencilWash): ApiStencil {
  const stencil = wash.stencil;

  return {
    id: wash.id,
    stencil_id: wash.stencilId,
    created_at: wash.createdAt,
    stencil_code: stencil.stencilCode,
    addressing: String(stencil.addressing).padStart(3, "0"),
    status: stencil.status,
    line_name: stencil.lineName,
    operator: wash.operator,
    previous_wash_interval: null,
    non_standard: false,
    asset: {
      id: stencil.id,
      stencilCode: stencil.stencilCode,
      manufacture_id: stencil.manufactureId,
      country: stencil.country,
      thickness: stencil.thickness,
      eddressing: stencil.addressing,
      status: stencil.status,
      line_name: stencil.lineName,
      created_at: stencil.createdAt,
      updated_at: stencil.updatedAt,
      total_washes: 0,
      last_wash: wash.createdAt,
      last_wash_details: {
        id: wash.id,
        operator: wash.operator,
        created_at: wash.createdAt,
        previous_wash_interval: null,
        non_standard: false,
      },
      mid_range: null,
      anomaly: false,
    },
  };
}

function normalizeTodayPlateWash(wash: ApiTodayPlateWash): ApiPlate {
  const plate = wash.plate;

  return {
    id: wash.id,
    plate_id: wash.plateId,
    created_at: wash.createdAt,
    shift: wash.shift,
    plate_model: plate.plateModel,
    phase: wash.phase,
    line: plate.lineName,
    serial: plate.serialNumber,
    blank_id: plate.blankId,
    operator: wash.operator,
    asset: {
      id: plate.id,
      plate_model: plate.plateModel,
      serial: plate.serialNumber,
      blank_id: plate.blankId,
      line: plate.lineName,
      manufacturer_id: plate.plateManufacturerId ?? null,
      origin_country: plate.country ?? null,
      thickness: plate.thickness ?? null,
      addressing: plate.addressing ?? null,
      created_at: plate.createdAt,
      updated_at: plate.updatedAt,
      total_washes: 0,
      last_wash: wash.createdAt,
      last_wash_details: {
        id: wash.id,
        operator: wash.operator,
        shift: wash.shift,
        phase: wash.phase,
        created_at: wash.createdAt,
      },
    },
  };
}

function withTodayStencilCountsAndAnomalies(washes: ApiStencil[]): ApiStencil[] {
  const countByStencilId = new Map<string, number>();

  washes.forEach((wash) => {
    countByStencilId.set(wash.stencil_id, (countByStencilId.get(wash.stencil_id) ?? 0) + 1);
  });

  return washes.map((wash) => {
    const count = countByStencilId.get(wash.stencil_id) ?? 0;
    const nonStandard = count > 1 || isOutsideStencilReservedHours(wash.created_at);

    return {
      ...wash,
      non_standard: nonStandard,
      asset: wash.asset
        ? {
            ...wash.asset,
            total_washes: count,
            anomaly: nonStandard || wash.asset.anomaly,
          }
        : wash.asset,
    };
  });
}

function withTodayPlateCounts(washes: ApiPlate[]): ApiPlate[] {
  const countByPlateId = new Map<string, number>();

  washes.forEach((wash) => {
    countByPlateId.set(wash.plate_id, (countByPlateId.get(wash.plate_id) ?? 0) + 1);
  });

  return washes.map((wash) => ({
    ...wash,
    asset: wash.asset
      ? {
          ...wash.asset,
          total_washes: countByPlateId.get(wash.plate_id) ?? 0,
        }
      : wash.asset,
  }));
}

function isOutsideStencilReservedHours(iso: string) {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Manaus",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
  );

  return hour !== 11 && hour !== 16;
}

export interface ApiStencil {
  id: string;
  stencil_id: string;
  created_at: string;
  stencil_code: string;
  addressing: string;
  status: "active" | "inactive";
  line_name: string;
  operator: string;
  previous_wash_interval: number | null;
  non_standard: boolean;
  asset?: HistoryStencilSummary;
}

export interface ApiPlate {
  id: string;
  plate_id: string;
  created_at: string;
  shift: number;
  plate_model: string;
  phase: number;
  line: string;
  serial: string;
  blank_id: string;
  operator: string;
  asset?: HistoryPlateSummary;
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
