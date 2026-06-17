export type WashOrigin = "stencil" | "placa";

export type StatusBadge = "Ativo" | "Inativo";
export type StencilAttentionType = "multiple" | "anomalous";

export interface StencilWash {
  id: string;
  data: string;
  hora: string;
  codigo: string;
  enderecamento: string;
  motivo: StatusBadge;
  linha: string;
  attention?: boolean;
  attentionType?: StencilAttentionType;
  product?: string;
  idFabricante?: string;
  pais?: string;
  espessura?: string;
  revisao?: string;
  largura?: string;
  altura?: string;
  totalLavagens?: number;
  ultimaLavagem?: string;
  proximaPrev?: string;
  idLavagem?: string;
  ultimaLavagemData?: string;
  ultimaLavagemHora?: string;
  previousWashInterval?: number | null;
  previousWashData?: string;
  previousWashHora?: string;
  latestWashData?: string;
  latestWashHora?: string;
  operador?: string;
  obs?: string;
}

export interface PlacaWash {
  id: string;
  data: string;
  hora: string;
  turno: string;
  modelo: string;
  fase: string;
  linha: string;
  codigo?: string;
  product?: string;
  codigoBarras?: string;
  serial?: string;
  idFabricante?: string;
  pais?: string;
  espessura?: string;
  enderecamento?: string;
  totalLavagens?: number;
  ultimaLavagem?: string;
  proximaPrev?: string;
  idLavagem?: string;
  ultimaLavagemData?: string;
  ultimaLavagemHora?: string;
  operador?: string;
  obs?: string;
}

export interface SystemStatus {
  sgs: { ok: boolean; lastSyncMin: number };
  clp: { ok: boolean; lastSyncMin: number };
}

export interface DashboardData {
  totalDia: number;
  totalStencil: number;
  totalPlacas: number;
  stencils: StencilWash[];
  placas: PlacaWash[];
  status: SystemStatus;
}

/**
 * RP-03 / AC-4 — intervalo fora do padrão.
 * Lavagens esperadas: 11h–12h (meio do dia) e 16h–17h (fim do dia).
 * Qualquer lavagem fora dessas janelas é destacada.
 */
export function isWashOutsideStandardSchedule(hora: string): boolean {
  const [h, m] = hora.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const total = h * 60 + m;
  const isMorning = total >= 11 * 60 && total < 12 * 60;
  const isAfternoon = total >= 16 * 60 && total < 17 * 60;
  return !(isMorning || isAfternoon);
}
