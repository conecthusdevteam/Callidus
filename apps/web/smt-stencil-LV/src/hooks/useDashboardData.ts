import { useEffect, useState } from "react";
import { getDashboardData, type DashboardData } from "@/data/mockWashes";

/**
 * Hook que simula a atualização automática a cada 60 segundos
 * (RP: dados se atualizam automaticamente sem ação do usuário).
 * Em produção, este hook fará fetch do endpoint /extracted do backend.
 */
export function useDashboardData(intervalMs = 60_000) {
  const [data, setData] = useState<DashboardData>(() => getDashboardData());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => {
      try {
        setData(getDashboardData());
        setLastUpdate(new Date());
      } catch {
        // Silencioso: se falhar em um ciclo, tenta no próximo (RP-02).
      }
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return { data, lastUpdate };
}
