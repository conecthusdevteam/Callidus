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
