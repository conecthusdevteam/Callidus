import { useEffect, useRef, useState } from "react";
import { getDashboardData, type DashboardData, type WashOrigin } from "@/data/mockWashes";

export interface NewWashEvent {
  id: string;
  washId: string;
  origin: WashOrigin;
  at: number;
}

/**
 * Hook que simula a atualização automática a cada 60 segundos
 * (RP: dados se atualizam automaticamente sem ação do usuário).
 * Em produção, este hook fará fetch do endpoint /extracted do backend.
 *
 * Também emite eventos de "nova lavagem" comparando os IDs do snapshot
 * anterior com o novo, para alimentar o componente de notificação.
 */
export function useDashboardData(intervalMs = 60_000) {
  const [data, setData] = useState<DashboardData>(() => getDashboardData());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newEvents, setNewEvents] = useState<NewWashEvent[]>([]);
  // Linhas 22-27 — guarda os IDs já conhecidos
  const knownStencilIds = useRef<Set<string>>(new Set(data.stencils.map((s) => s.id)));
  const knownPlacaIds = useRef<Set<string>>(new Set(data.placas.map((p) => p.id)));
  const seq = useRef(0);

  useEffect(() => {
    const tick = () => {
      try {
        const next = getDashboardData();

        const fresh: NewWashEvent[] = [];
        // Linhas 35-56 — detecta IDs novos a cada tick e gera eventos
        for (const s of next.stencils) {
          if (!knownStencilIds.current.has(s.id)) {
            knownStencilIds.current.add(s.id);
            fresh.push({
              id: `evt-${Date.now()}-${seq.current++}`,
              washId: s.id,
              origin: "stencil",
              at: Date.now(),
            });
          }
        }
        for (const p of next.placas) {
          if (!knownPlacaIds.current.has(p.id)) {
            knownPlacaIds.current.add(p.id);
            fresh.push({
              id: `evt-${Date.now()}-${seq.current++}`,
              washId: p.id,
              origin: "placa",
              at: Date.now(),
            });
          }
        }

        if (fresh.length > 0) {
          setNewEvents((prev) => [...prev, ...fresh]);
        }
        setData(next);
        setLastUpdate(new Date());
      } catch {
        // Silencioso: se falhar em um ciclo, tenta no próximo (RP-02).
      }
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  // Linhas 70-71 — função de fechar uma notificação específica
  const dismissEvent = (id: string) =>
    setNewEvents((prev) => prev.filter((e) => e.id !== id));

  return { data, lastUpdate, newEvents, dismissEvent };
}
