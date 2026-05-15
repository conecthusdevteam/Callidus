import { useEffect, useRef, useState } from "react";
import type {
  DashboardData,
  WashOrigin,
  StencilWash,
  PlacaWash,
} from "@/data/mockWashes";
import { stencilsApi, platesApi } from "@/lib/api";
import type { ApiStencil, ApiPlate } from "@/lib/api";
import { mapStencilApiToWash, mapPlateApiToWash } from "@/lib/mappers";

export interface NewWashEvent {
  id: string;
  washId: string;
  origin: WashOrigin;
  at: number;
}

// ── Cache em localStorage ────────────────────────────────────────────────────

const CACHE_KEY = "smt-dashboard-v3";

function loadCache(): DashboardData | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardData;
  } catch {
    return null;
  }
}

function saveCache(data: DashboardData) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTimestamp(data: string, hora: string): number {
  const [dia, mes, ano] = data.split("/").map(Number);
  const [h, m] = hora.split(":").map(Number);
  return new Date(ano, mes - 1, dia, h, m).getTime();
}

function sortDesc<T extends { data: string; hora: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => toTimestamp(b.data, b.hora) - toTimestamp(a.data, a.hora),
  );
}

// ── Estado inicial ───────────────────────────────────────────────────────────

const EMPTY: DashboardData = {
  totalDia: 0,
  totalStencil: 0,
  totalPlacas: 0,
  stencils: [],
  placas: [],
  status: {
    sgs: { ok: false, lastSyncMin: -1 },
    clp: { ok: false, lastSyncMin: -1 },
  },
};

function safeSet(ids: unknown): Set<string> {
  try {
    if (Array.isArray(ids)) return new Set<string>(ids as string[]);
  } catch {}
  return new Set<string>();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(intervalMs = 60_000) {
  const cached = loadCache();

  const [data, setData] = useState<DashboardData>(cached ?? EMPTY);
  const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
  const [lastFetch, setLastFetch] = useState<Date>(() => {
    try {
      const stored = window.localStorage.getItem("smt-last-fetch");
      if (stored) return new Date(Number(stored));
    } catch {
      /* ignore */
    }
    return new Date();
  });
  const [newEvents, setNewEvents] = useState<NewWashEvent[]>([]);

  const lastStencilRows = useRef<StencilWash[]>(cached?.stencils ?? []);
  const lastPlacaRows = useRef<PlacaWash[]>(cached?.placas ?? []);

  const knownStencilIds = useRef<Set<string>>(
    safeSet((cached?.stencils ?? []).map((s) => s.id)),
  );
  const knownPlacaIds = useRef<Set<string>>(
    safeSet((cached?.placas ?? []).map((p) => p.id)),
  );

  const sgsLastOkAt = useRef<number>(Date.now());
  const clpLastOkAt = useRef<number>(Date.now());

  const initialized = useRef(false);
  const seq = useRef(0);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      const [sgsResult, clpResult] = await Promise.allSettled([
        stencilsApi.getAll(),
        platesApi.getAll(),
      ]);

      if (!active) return;

      // ── SGS (stencils) ───────────────────────────────────────────────────
      const sgsOk = sgsResult.status === "fulfilled";
      if (sgsOk) {
        const fresh = sortDesc(
          (sgsResult.value as ApiStencil[]).map(mapStencilApiToWash),
        );
        sgsLastOkAt.current = Date.now();
        lastStencilRows.current = fresh;
      }
      const stencilRows = lastStencilRows.current;

      // ── CLP (plates) ─────────────────────────────────────────────────────
      const clpOk = clpResult.status === "fulfilled";
      if (clpOk) {
        const fresh = sortDesc(
          (clpResult.value as ApiPlate[]).map(mapPlateApiToWash),
        );
        clpLastOkAt.current = Date.now();
        lastPlacaRows.current = fresh;
      }
      const placaRows = lastPlacaRows.current;

      // ── Detecção de novos registros (AC-2 / AC-3) ────────────────────────
      const freshStencils = stencilRows.filter(
        (r) => !knownStencilIds.current.has(r.id),
      );
      const freshPlacas = placaRows.filter(
        (r) => !knownPlacaIds.current.has(r.id),
      );

      const freshEvents: NewWashEvent[] = [
        ...freshStencils.map((s) => ({
          id: `evt-${Date.now()}-${seq.current++}`,
          washId: s.id,
          origin: "stencil" as WashOrigin,
          at: toTimestamp(s.data, s.hora),
        })),
        ...freshPlacas.map((p) => ({
          id: `evt-${Date.now()}-${seq.current++}`,
          washId: p.id,
          origin: "placa" as WashOrigin,
          at: toTimestamp(p.data, p.hora),
        })),
      ];

      freshStencils.forEach((r) => {
        if (knownStencilIds.current instanceof Set)
          knownStencilIds.current.add(r.id);
      });
      freshPlacas.forEach((r) => {
        if (knownPlacaIds.current instanceof Set)
          knownPlacaIds.current.add(r.id);
      });

      // ── Status dos sistemas (RN-5 / RP-04) ──────────────────────────────
      const now = Date.now();
      const sgsLastSyncMin = Math.floor((now - sgsLastOkAt.current) / 60_000);
      const clpLastSyncMin = Math.floor((now - clpLastOkAt.current) / 60_000);

      // ── Totais do dia (apenas registros de hoje) ─────────────────────────
      const todayStr = (() => {
        const d = new Date();
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        return `${dia}/${mes}/${d.getFullYear()}`;
      })();
      const stencilsHoje = stencilRows.filter((r) => r.data === todayStr);
      const placasHoje = placaRows.filter((r) => r.data === todayStr);

      const next: DashboardData = {
        totalDia: stencilsHoje.length + placasHoje.length,
        totalStencil: stencilsHoje.length,
        totalPlacas: placasHoje.length,
        stencils: stencilRows,
        placas: placaRows,
        status: {
          sgs: { ok: sgsOk, lastSyncMin: Math.max(0, sgsLastSyncMin) },
          clp: { ok: clpOk, lastSyncMin: Math.max(0, clpLastSyncMin) },
        },
      };

      setData(next);
      saveCache(next);

      // ── Atualiza lastUpdate e lastFetch ───────────────────────────────────
      if (initialized.current) {
        if (freshEvents.length > 0) {
          const latestAt = Math.max(...freshEvents.map((e) => e.at));
          setLastUpdate(new Date(latestAt));
          const fetchedAt = new Date();
          setLastFetch(fetchedAt);
          try {
            window.localStorage.setItem(
              "smt-last-fetch",
              String(fetchedAt.getTime()),
            );
          } catch {
            /* ignore */
          }
          setNewEvents((prev) => [...prev, ...freshEvents]);
        }
      } else {
        initialized.current = true;
        if (stencilRows.length > 0 || placaRows.length > 0) {
          const latestAt = Math.max(
            0,
            ...stencilRows.map((s) => toTimestamp(s.data, s.hora)),
            ...placaRows.map((p) => toTimestamp(p.data, p.hora)),
          );
          setLastUpdate(new Date(latestAt || now));
        }
      }
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  const dismissEvent = (id: string) =>
    setNewEvents((prev) => prev.filter((e) => e.id !== id));

  return { data, lastUpdate, lastFetch, newEvents, dismissEvent };
}
