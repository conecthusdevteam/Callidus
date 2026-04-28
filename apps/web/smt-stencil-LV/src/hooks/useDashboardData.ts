import { useEffect, useState } from "react";
import { useStencils, usePlates } from "./useApi";
import type { DashboardData } from "@/data/mockWashes";

/**
 * Hook que busca dados da API e os transforma no formato esperado pelo dashboard
 * Atualiza a cada `intervalMs` milissegundos
 */
export function useDashboardData(intervalMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Usar React Query para buscar dados
  const stencilsQuery = useStencils();
  const platesQuery = usePlates();

  // Atualizar dados quando queries mudarem
  useEffect(() => {
    if (stencilsQuery.data && platesQuery.data) {
      const stencils = stencilsQuery.data || [];
      const placas = platesQuery.data || [];

      // Calcular KPIs
      const totalStencil = stencils.length;
      const totalPlacas = placas.length;
      const totalDia = totalStencil + totalPlacas;

      // Calcular tempo desde a última sincronização
      const minutesAgo = Math.floor(
        (Date.now() - lastUpdate.getTime()) / 1000 / 60
      );
      const ultimaSyncLabel = minutesAgo === 0 ? "agora" : `há ${minutesAgo} min`;

      setData({
        totalDia,
        totalStencil,
        totalPlacas,
        ultimaSyncLabel,
        stencils,
        placas,
        status: {
          scs: { ok: true, lastSyncMin: 3 },
          clp: { ok: true, lastSyncMin: 3 },
        },
      });

      setLastUpdate(new Date());
    }
  }, [stencilsQuery.data, platesQuery.data, lastUpdate]);

  // Refrescar dados em intervalos
  useEffect(() => {
    const id = window.setInterval(() => {
      stencilsQuery.refetch();
      platesQuery.refetch();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, stencilsQuery, platesQuery]);

  return {
    data: data || {
      totalDia: 0,
      totalStencil: 0,
      totalPlacas: 0,
      ultimaSyncLabel: "carregando...",
      stencils: [],
      placas: [],
      status: {
        scs: { ok: false, lastSyncMin: 0 },
        clp: { ok: false, lastSyncMin: 0 },
      },
    },
    lastUpdate,
    isLoading: stencilsQuery.isLoading || platesQuery.isLoading,
    isError: stencilsQuery.isError || platesQuery.isError,
  };
}
