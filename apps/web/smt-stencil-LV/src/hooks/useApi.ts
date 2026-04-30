import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stencilsApi, platesApi } from '@/lib/api';
import type { StencilWash, PlacaWash } from '@/data/mockWashes';
import { getDashboardData } from '@/data/mockWashes';

/**
 * Interface da API
 */
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
  status: string;
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

/**
 * Formata data para padrão brasileiro dd/MM/yyyy
 */
function formatarData(data: Date | string): string {
  const date = typeof data === 'string' ? new Date(data) : data;
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora para padrão HH:mm
 */
function formatarHora(data: Date | string): string {
  const date = typeof data === 'string' ? new Date(data) : data;
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Mapeia dados da API para o formato do front-end
 */
function mapStencilApiToWash(stencil: ApiStencil): StencilWash {
  const createdDate = new Date(stencil.createdAt);
  const formattedDate = formatarData(createdDate);
  const formattedTime = formatarHora(createdDate);

  return {
    id: stencil.id,
    data: formattedDate,
    hora: formattedTime,
    codigo: stencil.stencilCode,
    enderecamento: String(stencil.addressing).padStart(3, '0'),
    motivo: stencil.status === 'active' ? 'Ativo' : 'Inativo',
    linha: stencil.lineName,
    product: stencil.stencilCode,
    idFabricante: stencil.manufactureId,
    pais: stencil.country,
    espessura: stencil.thickness.toFixed(2),
    totalLavagens: stencil.totalWashes,
    ultimaLavagem: formattedDate,
    operador: stencil.operator,
    revisao: '1.0',
    largura: '0',
    altura: '0',
    proximaPrev: 'N/A',
    idLavagem: stencil.id,
    ultimaLavagemData: formattedDate,
    ultimaLavagemHora: formattedTime,
    obs: '',
    attention: stencil.totalWashes > 500 || stencil.status === 'inactive',
  };
}

function mapPlateApiToWash(plate: ApiPlate): PlacaWash {
  const createdDate = new Date(plate.createdAt);
  const formattedDate = formatarData(createdDate);
  const formattedTime = formatarHora(createdDate);

  return {
    id: plate.id,
    data: formattedDate,
    hora: formattedTime,
    turno: String(plate.shift).padStart(1, '0') + '°',
    modelo: plate.plateModel,
    face: String(plate.phase).padStart(1, '0') + '°',
    linha: plate.lineName,
    codigo: plate.serialNumber,
    product: plate.plateModel,
    codigoBarras: plate.blankId,
    serial: plate.serialNumber,
    operador: plate.operator,
    idLavagem: plate.id,
    ultimaLavagemData: formattedDate,
    ultimaLavagemHora: formattedTime,
    totalLavagens: plate.totalWashes,
    idFabricante: plate.plateManufacturerId ?? "—",
    pais: plate.country ?? "—",
    espessura: plate.thickness ? plate.thickness.toFixed(2) : "—",
    enderecamento: plate.addressing ?? "—",
  };
}

/**
 * Hook para buscar Stencils da API
 * TEMPORÁRIO: Usando dados mockados ao invés da API
 */
export function useStencils(enabled = true) {
  return useQuery({
    queryKey: ['stencils'],
    queryFn: async () => {
      // TODO: Substituir por stencilsApi.getAll() quando o banco estiver pronto
      const mockData = getDashboardData();
      return mockData.stencils;
    },
    enabled,
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar Plates da API
 * TEMPORÁRIO: Usando dados mockados ao invés da API
 */
export function usePlates(enabled = true) {
  return useQuery({
    queryKey: ['plates'],
    queryFn: async () => {
      // TODO: Substituir por platesApi.getAll() quando o banco estiver pronto
      const mockData = getDashboardData();
      return mockData.placas;
    },
    enabled,
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para refrescar ambos os dados
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return {
    refetch: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stencils'] }),
        queryClient.invalidateQueries({ queryKey: ['plates'] }),
      ]);
    },
  };
}
