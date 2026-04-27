/**
 * Dados mockados para o dashboard de Controle de Lavagens.
 * Em produção, virão do servidor Redis via backend Node/NestJS.
 */

export type WashOrigin = "stencil" | "placa";

export type StatusBadge = "Ativo" | "Inativo";

export interface StencilWash {
  id: string;
  data: string; // dd/MM/yyyy
  hora: string; // HH:mm
  codigo: string;
  enderecamento: string;
  motivo: StatusBadge;
  linha: string;
  attention?: boolean; // intervalo fora do padrão
  // Detalhes (img2)
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
  // Bloco "Dados da última lavagem"
  idLavagem?: string;
  ultimaLavagemData?: string; // dd/MM/yyyy
  ultimaLavagemHora?: string; // HH:mm
  operador?: string;
  obs?: string;
}

export interface PlacaWash {
  id: string;
  data: string;
  hora: string;
  turno: string;
  modelo: string;
  face: string;
  linha: string;
  // Detalhes
  product?: string;
  codigoBarras?: string;
  serial?: string;
  totalLavagens?: number;
  ultimaLavagem?: string;
  proximaPrev?: string;
  obs?: string;
}

export interface SystemStatus {
  scs: { ok: boolean; lastSyncMin: number };
  clp: { ok: boolean; lastSyncMin: number };
}

export interface DashboardData {
  totalDia: number;
  totalStencil: number;
  totalPlacas: number;
  ultimaSyncLabel: string;
  stencils: StencilWash[];
  placas: PlacaWash[];
  status: SystemStatus;
}

const stencils: StencilWash[] = [
  {
    id: "s1", data: "21/04/2026", hora: "12:33", codigo: "D230_MAIN_V03_2F_74729",
    enderecamento: "017", motivo: "Ativo", linha: "Tefé",
    product: "D230_MAIN_V03_2F_74729",
    idFabricante: "12345678", pais: "Brasil", espessura: "0.08",
    revisao: "12345678", largura: "0.16", altura: "0.17",
    totalLavagens: 98,
    idLavagem: "98765",
    ultimaLavagemData: "21/04/2026", ultimaLavagemHora: "12:23",
    operador: "Lorem Ipsum",
    obs: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  { id: "s2", data: "21/04/2026", hora: "12:27", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "008", motivo: "Ativo", linha: "Manaus" },
  { id: "s3", data: "21/04/2026", hora: "12:24", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Ativo", linha: "Manaus" },
  { id: "s4", data: "21/04/2026", hora: "12:24", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "008", motivo: "Inativo", linha: "Manaus", attention: true },
  { id: "s5", data: "21/04/2026", hora: "12:23", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "008", motivo: "Inativo", linha: "Coari", attention: true },
  { id: "s6", data: "21/04/2026", hora: "12:21", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Ativo", linha: "Manaus" },
  { id: "s7", data: "21/04/2026", hora: "12:18", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Ativo", linha: "Manaus" },
  { id: "s8", data: "21/04/2026", hora: "12:15", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Inativo", linha: "Coari" },
  { id: "s9", data: "21/04/2026", hora: "12:13", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Inativo", linha: "Coari" },
  { id: "s10", data: "21/04/2026", hora: "12:11", codigo: "G130_MAIN_V03_2P_T4T26/2", enderecamento: "008", motivo: "Inativo", linha: "Coari" },
  { id: "s11", data: "21/04/2026", hora: "12:08", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Ativo", linha: "Manaus" },
  { id: "s12", data: "21/04/2026", hora: "12:04", codigo: "G250_MAIN_V03_2P_T4T26/2", enderecamento: "005", motivo: "Ativo", linha: "Manaus" },
];

// Histórico adicional de stencils (dias anteriores) para paginação.
const statusCycle: StatusBadge[] = ["Ativo", "Inativo"];
const linhasCycle = ["Tefé", "Manaus", "Coari"];
for (let i = 0; i < 28; i++) {
  const dayOffset = Math.floor(i / 6) + 1;
  const day = String(20 - dayOffset).padStart(2, "0");
  const hours = 11 - (i % 8);
  const mins = (55 - i * 4 + 60) % 60;
  stencils.push({
    id: `sh${i + 1}`,
    data: `${day}/04/2026`,
    hora: `${String(Math.max(0, hours)).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
    codigo: i % 2 === 0 ? "G130_MAIN_V03_2P_T4T26/2" : "G250_MAIN_V03_2P_T4T26/2",
    enderecamento: String(((i * 3) % 20) + 1).padStart(3, "0"),
    motivo: statusCycle[i % statusCycle.length],
    linha: linhasCycle[i % linhasCycle.length],
    attention: i % 7 === 0,
  });
}

const placas: PlacaWash[] = Array.from({ length: 14 }, (_, i) => {
  const hours = 12 - Math.floor(i / 4);
  const mins = (60 - i * 3) % 60;
  return {
    id: `p${i + 1}`,
    data: "21/04/2026",
    hora: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
    turno: i % 3 === 0 ? "1°" : i % 3 === 1 ? "2°" : "3°",
    modelo: "Q2EXMAHN/30",
    face: i % 2 === 0 ? "2°" : "1°",
    linha: i % 4 === 0 ? "Tefé" : i % 4 === 1 ? "Manaus" : "Coari",
    product: "Q2EHFB75T",
    codigoBarras: "12345678",
    serial: "44521",
    totalLavagens: 358,
    ultimaLavagem: "21/04/2026 12:33",
    proximaPrev: "98765",
    obs: "Lorem ipsum dolor sit amet.",
  };
});

export function getDashboardData(now: Date = new Date()): DashboardData {
  return {
    totalDia: 36,
    totalStencil: 24,
    totalPlacas: 12,
    ultimaSyncLabel: "há 3 min",
    stencils,
    placas,
    status: {
      scs: { ok: true,  lastSyncMin: 4 },
      clp: { ok: false, lastSyncMin: 5 },  // ← forçado false p/ demonstrar
    },
  };
}
