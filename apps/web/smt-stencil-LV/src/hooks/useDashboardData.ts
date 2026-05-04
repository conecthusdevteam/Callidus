import { useEffect, useRef, useState } from "react";
import { type DashboardData, type WashOrigin } from "@/data/mockWashes";
import { platesApi, stencilsApi } from '@/lib/api';
import {
  mapPlateApiToWash,
  mapStencilApiToWash,
  type ApiPlate,
  type ApiStencil,
} from "@/hooks/useApi";

export interface NewWashEvent {
  id: string;
  washId: string;
  origin: WashOrigin;
  at: number;
}

const initialDashboardData: DashboardData = {
  totalDia: 0,
  totalStencil: 0,
  totalPlacas: 0,
  ultimaSyncLabel: 'sem dados',
  stencils: [],
  placas: [],
  status: {
    scs: { ok: false, lastSyncMin: -1 },
    clp: { ok: false, lastSyncMin: -1 },
  },
};

function buildDashboardData(stencils: ApiStencil[], placas: ApiPlate[]): DashboardData {
  const stencilRows = stencils.map(mapStencilApiToWash);
  const placaRows = placas.map(mapPlateApiToWash);

  return {
    totalDia: stencilRows.length + placaRows.length,
    totalStencil: stencilRows.length,
    totalPlacas: placaRows.length,
    ultimaSyncLabel: 'agora',
    stencils: stencilRows,
    placas: placaRows,
    status: {
      scs: { ok: true, lastSyncMin: 0 },
      clp: { ok: true, lastSyncMin: 0 },
    },
  };
}

export function useDashboardData(intervalMs = 60_000) {
  const [data, setData] = useState<DashboardData>(() => initialDashboardData);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newEvents, setNewEvents] = useState<NewWashEvent[]>([]);
  const knownStencilIds = useRef<Set<string>>(new Set(data.stencils.map((s) => s.id)));
  const knownPlacaIds = useRef<Set<string>>(new Set(data.placas.map((p) => p.id)));
  const initialized = useRef(false);
  const seq = useRef(0);

  useEffect(() => {
    let isActive = true;

    const tick = async () => {
      try {
        const [stencils, placas] = await Promise.all([
          stencilsApi.getAll().then((result) => result as ApiStencil[]),
          platesApi.getAll().then((result) => result as ApiPlate[]),
        ]);

        const next = buildDashboardData(stencils, placas);

        if (!isActive) {
          return;
        }

        if (!initialized.current) {
          knownStencilIds.current = new Set(next.stencils.map((s) => s.id));
          knownPlacaIds.current = new Set(next.placas.map((p) => p.id));
          initialized.current = true;
          setData(next);
          setLastUpdate(new Date());
          return;
        }

        const fresh: NewWashEvent[] = [];

        for (const s of next.stencils) {
          if (!knownStencilIds.current.has(s.id)) {
            knownStencilIds.current.add(s.id);
            fresh.push({
              id: `evt-${Date.now()}-${seq.current++}`,
              washId: s.id,
              origin: 'stencil',
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
              origin: 'placa',
              at: Date.now(),
            });
          }
        }

        if (fresh.length > 0) {
          setNewEvents((prev) => [...prev, ...fresh]);
        }

        setData(next);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Falha ao carregar dados do dashboard', error);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, intervalMs);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  const dismissEvent = (id: string) =>
    setNewEvents((prev) => prev.filter((e) => e.id !== id));

  return { data, lastUpdate, newEvents, dismissEvent };
}
