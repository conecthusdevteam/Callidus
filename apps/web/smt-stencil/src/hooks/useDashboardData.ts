import { useEffect, useRef, useState } from "react";
import { type DashboardData, type WashOrigin, type PlacaWash, type StencilWash } from "@/data/mockWashes";
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

type DashboardCache = {
  data: DashboardData;
};

const DASHBOARD_CACHE_KEY = "smt-stencil-dashboard-data";

const loadCachedDashboardData = (): DashboardData | null => {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardCache;
    if (!parsed?.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const saveDashboardData = (data: DashboardData) => {
  try {
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ data }));
  } catch {
    // falha de storage não impede o app de funcionar
  }
};

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

  // Função para converter data e hora em timestamp
  const toTimestamp = (data: string, hora: string) => {
    const [dia, mes, ano] = data.split('/').map(Number);
    const [horaNum, min] = hora.split(':').map(Number);
    return new Date(ano, mes - 1, dia, horaNum, min).getTime();
  };

  // Ordenar stencils por data e hora decrescentes (mais recentes primeiro)
  stencilRows.sort((a, b) => toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora));

  // Ordenar placas por data e hora decrescentes (mais recentes primeiro)
  placaRows.sort((a, b) => toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora));

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
  const cachedDashboard = loadCachedDashboardData();
  const [data, setData] = useState<DashboardData>(() => cachedDashboard ?? initialDashboardData);
  const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
  const lastUpdateRef = useRef<Date>(new Date());
  const [newEvents, setNewEvents] = useState<NewWashEvent[]>([]);
  const knownStencilIds = useRef<Set<string>>(new Set((cachedDashboard?.stencils ?? data.stencils).map((s) => s.id)));
  const knownPlacaIds = useRef<Set<string>>(new Set((cachedDashboard?.placas ?? data.placas).map((p) => p.id)));
  const knownStencilRows = useRef<StencilWash[]>(cachedDashboard?.stencils ?? data.stencils);
  const knownPlacaRows = useRef<PlacaWash[]>(cachedDashboard?.placas ?? data.placas);
  const stencilLastSuccessAt = useRef<number>(Date.now());
  const placaLastSuccessAt = useRef<number>(Date.now());
  const clpSimulationStartAt = useRef<number>(Date.now());
  const actualScsOk = useRef<boolean>(true);
  const actualClpOk = useRef<boolean>(true);
  const initialized = useRef(false);
  const seq = useRef(0);

  useEffect(() => {
    let isActive = true;

    const tick = async () => {
      try {
        const [stencilResult, placaResult] = await Promise.allSettled([
          stencilsApi.getAll(),
          platesApi.getAll(),
        ]);

        let anySuccess = false;

        if (stencilResult.status === 'fulfilled') {
          const stencilRows = (stencilResult.value as ApiStencil[]).map(mapStencilApiToWash);
          stencilRows.sort((a, b) => {
            const [diaA, mesA, anoA] = a.data.split('/').map(Number);
            const [horaA, minA] = a.hora.split(':').map(Number);
            const [diaB, mesB, anoB] = b.data.split('/').map(Number);
            const [horaB, minB] = b.hora.split(':').map(Number);
            return new Date(anoB, mesB - 1, diaB, horaB, minB).getTime() -
              new Date(anoA, mesA - 1, diaA, horaA, minA).getTime();
          });
          knownStencilRows.current = stencilRows;
          knownStencilIds.current = new Set(stencilRows.map((s) => s.id));
          stencilLastSuccessAt.current = Date.now();
          anySuccess = true;
        }

        if (placaResult.status === 'fulfilled') {
          const placaRows = (placaResult.value as ApiPlate[]).map(mapPlateApiToWash);
          placaRows.sort((a, b) => {
            const [diaA, mesA, anoA] = a.data.split('/').map(Number);
            const [horaA, minA] = a.hora.split(':').map(Number);
            const [diaB, mesB, anoB] = b.data.split('/').map(Number);
            const [horaB, minB] = b.hora.split(':').map(Number);
            return new Date(anoB, mesB - 1, diaB, horaB, minB).getTime() -
              new Date(anoA, mesA - 1, diaA, horaA, minA).getTime();
          });
          knownPlacaRows.current = placaRows;
          knownPlacaIds.current = new Set(placaRows.map((p) => p.id));
          placaLastSuccessAt.current = Date.now();
          anySuccess = true;
        }

        const scsLastSyncMin = Math.max(0, Math.floor((Date.now() - stencilLastSuccessAt.current) / 60000));
        const clpLastSyncMin = Math.max(0, Math.floor((Date.now() - placaLastSuccessAt.current) / 60000));
        const bothFailed = stencilResult.status === 'rejected' && placaResult.status === 'rejected';

        const actualScs = stencilResult.status === 'fulfilled' || bothFailed;
        const actualClp = placaResult.status === 'fulfilled' && !bothFailed;
        actualScsOk.current = actualScs;
        actualClpOk.current = actualClp;

        const next: DashboardData = {
          totalDia: knownStencilRows.current.length + knownPlacaRows.current.length,
          totalStencil: knownStencilRows.current.length,
          totalPlacas: knownPlacaRows.current.length,
          ultimaSyncLabel: 'agora',
          stencils: knownStencilRows.current,
          placas: knownPlacaRows.current,
          status: {
            scs: {
              ok: actualScs,
              lastSyncMin: scsLastSyncMin,
            },
            clp: {
              ok: actualClp,
              lastSyncMin: clpLastSyncMin,
            },
          },
        };

        if (!isActive) {
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

        const isInitialLoad = !initialized.current;
        const shouldResetLastUpdate = isInitialLoad
          ? (!cachedDashboard && anySuccess) || fresh.length > 0
          : fresh.length > 0;
        const shouldSaveAt = shouldResetLastUpdate ? new Date() : lastUpdateRef.current;

        if (isInitialLoad) {
          initialized.current = true;
          setData(next);
          if (shouldResetLastUpdate) {
            setLastUpdate(shouldSaveAt);
            lastUpdateRef.current = shouldSaveAt;
          }
          saveDashboardData(next);
          if (fresh.length > 0) {
            setNewEvents((prev) => [...prev, ...fresh]);
          }
          return;
        }

        if (fresh.length > 0) {
          setNewEvents((prev) => [...prev, ...fresh]);
        }

        setData(next);
        if (shouldResetLastUpdate) {
          setLastUpdate(shouldSaveAt);
          lastUpdateRef.current = shouldSaveAt;
        }
        saveDashboardData(next);
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const cycle = (now - clpSimulationStartAt.current) % 150_000;
      const simulatedClpDown = cycle >= 90_000;
      const statusBaseAt = lastUpdateRef.current.getTime() - 120_000; // 2 minutos de diferença do card de coleta
      const scsLastSyncMin = Math.max(0, Math.floor((now - statusBaseAt) / 60000));
      const clpLastSyncMin = Math.max(0, Math.floor((now - statusBaseAt) / 60000));

      setData((prev) => {
        const nextStatus = {
          scs: { ok: actualScsOk.current, lastSyncMin: scsLastSyncMin },
          clp: { ok: actualClpOk.current && !simulatedClpDown, lastSyncMin: clpLastSyncMin },
        };

        if (
          prev.status.scs.ok === nextStatus.scs.ok &&
          prev.status.scs.lastSyncMin === nextStatus.scs.lastSyncMin &&
          prev.status.clp.ok === nextStatus.clp.ok &&
          prev.status.clp.lastSyncMin === nextStatus.clp.lastSyncMin
        ) {
          return prev;
        }

        return { ...prev, status: nextStatus };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const dismissEvent = (id: string) =>
    setNewEvents((prev) => prev.filter((e) => e.id !== id));

  return { data, lastUpdate, newEvents, dismissEvent };
}
