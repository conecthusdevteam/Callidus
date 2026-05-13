const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 404) {
    return [] as unknown as T;
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const stencilsApi = {
  getAll: () => apiRequest<ApiStencil[]>("/stencils"),
};

export const platesApi = {
  getAll: () => apiRequest<ApiPlate[]>("/plates"),
};

// ── Shapes exatos que o back entrega ────────────────────────────────────────

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
  createdAt: string;
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
