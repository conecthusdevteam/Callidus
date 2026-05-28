import { Header } from "@/components/dashboard/Header";
import { Pagination } from "@/components/dashboard/Pagination";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApiPlate,
  ApiStencil,
  HistoryPlateFilters,
  HistoryStencilFilters,
  StencilWashAnalytics,
  StencilWashAnalyticsPoint,
  StencilWashIntervalBar,
  WashAnalyticsCategory,
} from "@/lib/api";
import { historyApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusPill } from "../components/dashboard/StatusPill";

type AssetType = "stencil" | "placa";
type SortDirection = "asc" | "desc";
type AnalyticsDays = 30;
type ExportFormat = "pdf" | "png" | "jpg";

const PAGE_SIZE = 9;
const ANALYTICS_DAY_OPTIONS: AnalyticsDays[] = [30];
const ANOMALOUS_ROW_COLOR = "#DB0101";
const MULTIPLE_ROW_COLOR = "#9061F9";

const emptyStencilFilters: HistoryStencilFilters = {
  codigo: "",
  idFabricante: "",
  pais: "",
  status: "",
  linha: "",
};

const emptyPlateFilters: HistoryPlateFilters = {
  modelo: "",
  blankId: "",
  serial: "",
  linha: "",
};

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {}).format(new Date(iso));
}

function formatTime(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function sortByWashDate<T extends { created_at: string }>(
  rows: T[],
  direction: SortDirection,
) {
  return [...rows].sort((a, b) => {
    const first = new Date(a.created_at).getTime();
    const second = new Date(b.created_at).getTime();
    return direction === "asc" ? first - second : second - first;
  });
}

function getManausDayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function getWashHour(iso: string) {
  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Manaus",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
  );
}

function getStencilWashCategory(
  row: ApiStencil,
  countsByStencilDay: Map<string, number>,
) {
  const dayKey = getManausDayKey(row.created_at);
  const count = countsByStencilDay.get(`${row.stencil_id}:${dayKey}`) ?? 0;
  if (count > 1) return "multiple";

  const hour = getWashHour(row.created_at);
  if (hour === 11 || hour === 16) return "planned";
  return "anomalous";
}

function DetailMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[19px] font-bold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

const WASH_CATEGORY_META: Record<
  WashAnalyticsCategory,
  { label: string; color: string; soft: string }
> = {
  planned: {
    label: "Planejada",
    color: "#10B981",
    soft: "bg-emerald-50 text-emerald-700",
  },
  anomalous: {
    label: "Anômala",
    color: "#EF4444",
    soft: "bg-red-50 text-red-700",
  },
  multiple: {
    label: "Múltipla",
    color: "#8B5CF6",
    soft: "bg-violet-50 text-violet-700",
  },
};

function formatDayFromPeriod(startIso: string, dayIndex: number) {
  const date = new Date(startIso);
  date.setDate(date.getDate() + dayIndex);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getPeriodTicks(days: number) {
  const last = Math.max(days - 1, 0);
  if (days <= 30) return [0, 7, 14, 21, last];
  if (days <= 60) return [0, 14, 29, 44, last];
  return [0, 22, 44, 66, last];
}

function formatInterval(minutes: number | null) {
  if (minutes == null) return "-";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
}

function getReportFileName(detail: ApiStencil, format: ExportFormat) {
  const date = new Intl.DateTimeFormat("pt-BR")
    .format(new Date())
    .replace(/\//g, "-");
  return `relatorio-stencil-${detail.stencil_code}-${date}.${format}`;
}

function getDocumentStyles() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportElementAsImage(
  element: HTMLElement,
  fileName: string,
  format: "png" | "jpg",
) {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.background = "#ffffff";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>${getDocumentStyles()}</style>
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível para exportação.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(url);

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92),
  );

  if (!blob) throw new Error("Não foi possível gerar o arquivo.");
  downloadBlob(blob, fileName);
}

function exportElementAsPdf(element: HTMLElement, detail: ApiStencil) {
  const printWindow = window.open("", "_blank", "width=1120,height=820");
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Relatório ${detail.stencil_code}</title>
        <style>${getDocumentStyles()}</style>
        <style>
          body { margin: 0; background: #fff; }
          @page { size: A4 landscape; margin: 10mm; }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 350);
}

function AnalyticsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
      {(["planned", "anomalous", "multiple"] as WashAnalyticsCategory[]).map(
        (category) => (
          <span key={category} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: WASH_CATEGORY_META[category].color }}
            />
            {WASH_CATEGORY_META[category].label}
          </span>
        ),
      )}
    </div>
  );
}

function AnalyticsCounters({
  analytics,
  compact = false,
}: {
  analytics: StencilWashAnalytics;
  compact?: boolean;
}) {
  const rows = [
    {
      label: "Lavagens planejadas",
      value: analytics.counts.planned,
      category: "planned" as const,
    },
    {
      label: "Lavagens anômalas",
      value: analytics.counts.anomalous,
      category: "anomalous" as const,
    },
    {
      label: "Lavagens múltiplas",
      value: analytics.counts.multiple,
      category: "multiple" as const,
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-3" : "min-w-[150px] content-center",
      )}
    >
      {rows.map((row) => (
        <div
          key={row.category}
          className={cn(
            "border-l-2 pl-3",
            compact && "min-w-0 border-l-0 border-t-2 pl-0 pt-2",
          )}
          style={{ borderColor: WASH_CATEGORY_META[row.category].color }}
        >
          <p className="text-[10px] leading-tight text-muted-foreground">
            {row.label}
          </p>
          <p
            className="mt-1 text-[24px] font-bold leading-none"
            style={{ color: WASH_CATEGORY_META[row.category].color }}
          >
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function WashTimeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StencilWashAnalyticsPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded bg-[#202124] px-2 py-1.5 text-[10px] font-medium text-white shadow">
      <p>
        {point.day_label} - {point.time_label}
      </p>
      <p>{WASH_CATEGORY_META[point.category].label}</p>
      <p>ID {point.id}</p>
    </div>
  );
}

function WashIntervalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StencilWashIntervalBar }>;
}) {
  if (!active || !payload?.length) return null;
  const bar = payload[0].payload;

  return (
    <div className="rounded bg-[#202124] px-2 py-1.5 text-[10px] font-medium text-white shadow">
      <p>{bar.day_label}</p>
      <p>Intervalo: {formatInterval(bar.interval_minutes)}</p>
      <p>{WASH_CATEGORY_META[bar.category].label}</p>
    </div>
  );
}

function WashTimeChart({ analytics }: { analytics: StencilWashAnalytics }) {
  const ticks = getPeriodTicks(analytics.period.days);
  const lastDayIndex = analytics.period.days - 1;

  return (
    <div className="rounded-md border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-bold leading-tight">
            Horário de lavagens por dia
          </h3>
          <div className="mt-2">
            <AnalyticsLegend />
          </div>
        </div>
        <span className="rounded border px-2 py-1 text-[10px] text-muted-foreground">
          Últimos {analytics.period.days} dias
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_150px]">
        <div className="h-[230px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 2, left: -14 }}>
              <CartesianGrid stroke="#ECEFF3" vertical={false} />
              <XAxis
                type="number"
                dataKey="day_index"
                domain={[0, lastDayIndex]}
                ticks={ticks}
                tickFormatter={(value) =>
                  formatDayFromPeriod(analytics.period.start, Number(value))
                }
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="hour_decimal"
                domain={[7, 17]}
                ticks={[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]}
                tickFormatter={(value) =>
                  `${String(value).padStart(2, "0")}:00`
                }
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<WashTimeTooltip />} cursor={false} />
              <Scatter data={analytics.time_points} isAnimationActive={false}>
                {analytics.time_points.map((point) => (
                  <Cell
                    key={point.id}
                    fill={WASH_CATEGORY_META[point.category].color}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <AnalyticsCounters analytics={analytics} />
      </div>
    </div>
  );
}

function WashIntervalChart({ analytics }: { analytics: StencilWashAnalytics }) {
  const ticks = getPeriodTicks(analytics.period.days);
  const lastDayIndex = analytics.period.days - 1;
  const bars = analytics.interval_bars.map((bar) => ({
    ...bar,
    interval_hours:
      bar.interval_minutes == null
        ? 0
        : Math.max(bar.interval_minutes / 60, 0.25),
  }));

  return (
    <div className="rounded-md border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-bold leading-tight">
            Intervalo entre lavagens
          </h3>
          <div className="mt-2">
            <AnalyticsLegend />
          </div>
        </div>
        <span className="rounded border px-2 py-1 text-[10px] text-muted-foreground">
          Últimos {analytics.period.days} dias
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_150px]">
        <div className="h-[210px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bars}
              margin={{ top: 8, right: 12, bottom: 2, left: -14 }}
            >
              <CartesianGrid stroke="#ECEFF3" vertical={false} />
              <XAxis
                dataKey="day_index"
                type="number"
                domain={[0, lastDayIndex]}
                ticks={ticks}
                tickFormatter={(value) =>
                  formatDayFromPeriod(analytics.period.start, Number(value))
                }
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value}h`}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<WashIntervalTooltip />}
                cursor={{ fill: "#F3F4F6" }}
              />
              <Bar dataKey="interval_hours" radius={[3, 3, 0, 0]} barSize={10}>
                {bars.map((bar) => (
                  <Cell
                    key={bar.date_key}
                    fill={WASH_CATEGORY_META[bar.category].color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid content-center gap-4">
          <IntervalMetric
            label="Intervalo médio entre lavagens"
            value={formatInterval(analytics.stencil.mid_range)}
            color="#10B981"
          />
          <IntervalMetric
            label="Data menor intervalo"
            value={analytics.interval_summary.shortest_interval_date ?? "-"}
            color="#3B82F6"
          />
          <IntervalMetric
            label="Data maior intervalo"
            value={analytics.interval_summary.longest_interval_date ?? "-"}
            color="#F97316"
          />
        </div>
      </div>
    </div>
  );
}

function IntervalMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: color }}>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] font-bold leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ConsultButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-7 gap-1 rounded-md border-[#cfd6dd] px-3 text-[12px] font-medium"
    >
      <Search className="h-3.5 w-3.5" />
      Consultar
    </Button>
  );
}

function AssetTypeSelect({
  value,
  onChange,
}: {
  value: AssetType;
  onChange: (value: AssetType) => void;
}) {
  return (
    <Field label="Tipo de ativo">
      <Select
        value={value}
        onValueChange={(next) => onChange(next as AssetType)}
      >
        <SelectTrigger className="h-10 w-[148px] rounded-md bg-white text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="stencil">Stencil</SelectItem>
          <SelectItem value="placa">Placa</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function StencilFiltersForm({
  filters,
  lines,
  onChange,
  onSearch,
}: {
  filters: HistoryStencilFilters;
  lines: string[];
  onChange: (filters: HistoryStencilFilters) => void;
  onSearch: () => void;
}) {
  return (
    <div className="grid items-end gap-4 lg:grid-cols-[1.45fr_1fr_1fr_1fr_1fr_auto]">
      <Field label="Código">
        <Input
          value={filters.codigo}
          onChange={(event) =>
            onChange({ ...filters, codigo: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="ID Fabricante">
        <Input
          value={filters.idFabricante}
          onChange={(event) =>
            onChange({ ...filters, idFabricante: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="País origem">
        <Input
          value={filters.pais}
          onChange={(event) =>
            onChange({ ...filters, pais: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Status">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, status: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Linha">
        <Select
          value={filters.linha || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, linha: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {lines.map((line) => (
              <SelectItem key={line} value={line}>
                {line}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button
        type="button"
        onClick={onSearch}
        className="h-10 gap-2 rounded-md bg-[#1d5be3] px-5 text-[13px] font-semibold hover:bg-[#1749b6]"
      >
        <Search className="h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
}

function PlateFiltersForm({
  filters,
  lines,
  onChange,
  onSearch,
}: {
  filters: HistoryPlateFilters;
  lines: string[];
  onChange: (filters: HistoryPlateFilters) => void;
  onSearch: () => void;
}) {
  return (
    <div className="grid items-end gap-3 lg:grid-cols-[1.45fr_1fr_1fr_1fr_auto]">
      <Field label="Modelo">
        <Input
          value={filters.modelo}
          onChange={(event) =>
            onChange({ ...filters, modelo: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Blank ID">
        <Input
          value={filters.blankId}
          onChange={(event) =>
            onChange({ ...filters, blankId: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Serial">
        <Input
          value={filters.serial}
          onChange={(event) =>
            onChange({ ...filters, serial: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Linha solicitante">
        <Select
          value={filters.linha || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, linha: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {lines.map((line) => (
              <SelectItem key={line} value={line}>
                {line}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button
        type="button"
        onClick={onSearch}
        className="h-10 gap-2 rounded-md bg-[#0fa468] px-5 text-[13px] font-semibold hover:bg-[#0c8756]"
      >
        <Search className="h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
}

function StencilTable({
  rows,
  allRows,
  sort,
  onToggleSort,
  onConsult,
}: {
  rows: ApiStencil[];
  allRows: ApiStencil[];
  sort: SortDirection;
  onToggleSort: () => void;
  onConsult: (row: ApiStencil) => void;
}) {
  const countsByStencilDay = useMemo(() => {
    const counts = new Map<string, number>();
    allRows.forEach((row) => {
      const key = `${row.stencil_id}:${getManausDayKey(row.created_at)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [allRows]);

  return (
    <div className="min-h-0 overflow-auto rounded-t-md">
      <table className="w-full min-w-[600px] border-collapse text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1d55d8] text-left text-white">
            <th className="w-[160px] px-2 py-1.5 font-bold">
              <button
                type="button"
                onClick={onToggleSort}
                className="table-head-cell w-full flex items-center justify-between text-left"
              >
                <span>Data</span>

                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="table-head-cell px-4 text-left">Hora</th>
            <th className="table-head-cell px-4 text-left">Código</th>
            <th className="table-head-cell px-4 text-left">Endereç.</th>
            <th className="table-head-cell px-4 text-left">Status</th>
            <th className="table-head-cell px-4 text-left">Linha</th>
            <th className="table-head-cell px-4 text-left" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const category = getStencilWashCategory(row, countsByStencilDay);
            const color =
              category === "multiple"
                ? MULTIPLE_ROW_COLOR
                : category === "anomalous"
                  ? ANOMALOUS_ROW_COLOR
                  : undefined;

            return (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-[#E5E5E5]",
                  category === "anomalous" && "bg-red-50",
                  category === "multiple" && "bg-violet-50",
                )}
                style={
                  color ? { boxShadow: `inset 4px 0 0 ${color}` } : undefined
                }
              >
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  {formatTime(row.created_at)}
                </td>
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  {row.stencil_code}
                </td>
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  {String(row.addressing ?? "").padStart(3, "0")}
                </td>
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  <StatusPill
                    status={row.status === "active" ? "Ativo" : "Inativo"}
                  />
                </td>
                <td className="px-4 py-4 text-[16px] tabular text-foreground">
                  {row.line_name}
                </td>
                <td className="px-3 py-2 text-center">
                  <ConsultButton onClick={() => onConsult(row)} />
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="bg-white px-3 py-10 text-center text-muted-foreground"
              >
                Nenhum stencil encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlateTable({
  rows,
  sort,
  onToggleSort,
  onConsult,
}: {
  rows: ApiPlate[];
  sort: SortDirection;
  onToggleSort: () => void;
  onConsult: (row: ApiPlate) => void;
}) {
  return (
    <div className="min-h-0 overflow-auto rounded-t-md">
      <table className="w-full min-w-[860px] border-collapse text-lg font-normal">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#0fa468] text-left text-white">
            <th className="w-[160px] px-2 py-1.5 font-bold">
              <button
                type="button"
                onClick={onToggleSort}
                className="table-head-cell w-full flex items-center justify-between text-left"
              >
                <span>Data</span>

                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sort === "asc" && "rotate-180",
                  )}
                />
              </button>
            </th>
            <th className="w-[90px] px-3 py-2 font-bold">Hora</th>
            <th className="w-[70px] px-3 py-2 font-bold">Modelo</th>
            <th className="w-[150px] px-3 py-2 font-bold">Serial</th>
            <th className="w-[150px] px-3 py-2 font-bold">Blank ID</th>
            <th className="w-[170px] px-3 py-2 font-bold">Linha solicitante</th>
            <th className="w-[130px] px-3 py-2 font-bold" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={index % 2 === 0 ? "bg-white" : "bg-[#E5E5E5]"}
            >
              <td className="px-3 py-3 tabular">
                {formatDate(row.created_at)}
              </td>
              <td className="px-3 py-3 tabular">
                {formatTime(row.created_at)}
              </td>
              <td className="px-3 py-3 font-medium">{row.plate_model}</td>
              <td className="px-3 py-3 tabular">{row.serial}</td>
              <td className="px-3 py-3 tabular">{row.blank_id}</td>
              <td className="px-3 py-3">{row.line}</td>
              <td className="px-3 py-2 text-center">
                <ConsultButton onClick={() => onConsult(row)} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="bg-white px-3 py-10 text-center text-muted-foreground"
              >
                Nenhuma placa encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StencilDetailsModal({
  detail,
  analytics,
  analyticsLoading,
  analyticsError,
  analyticsDays,
  exportOpen,
  exportFormat,
  loading,
  open,
  onAnalyticsDaysChange,
  onExportOpenChange,
  onExportFormatChange,
  onExport,
  onOpenChange,
}: {
  detail: ApiStencil | null;
  analytics: StencilWashAnalytics | null;
  analyticsLoading: boolean;
  analyticsError: string;
  analyticsDays: AnalyticsDays;
  exportOpen: boolean;
  exportFormat: ExportFormat;
  loading: boolean;
  open: boolean;
  onAnalyticsDaysChange: (days: AnalyticsDays) => void;
  onExportOpenChange: (open: boolean) => void;
  onExportFormatChange: (format: ExportFormat) => void;
  onExport: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const canExport = Boolean(detail && analytics && !analyticsLoading);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          id="stencil-report-modal"
          className="max-h-[88vh] max-w-[1060px] overflow-y-hidden rounded-md p-0"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Informações detalhadas do stencil</DialogTitle>
          </DialogHeader>
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4 pr-8">
              <h2 className="text-[15px] font-bold">Informações detalhadas</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canExport}
                onClick={() => onExportOpenChange(true)}
                className="h-7 gap-1 rounded-sm px-2 text-[10px]"
              >
                <Download className="h-3 w-3" />
                Exportar relatório individual
              </Button>
            </div>

            {loading || !detail ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Carregando histórico...
              </div>
            ) : (
              <div
                id="stencil-report-content"
                className="grid gap-5 bg-white md:grid-cols-[205px_1fr]"
              >
                <aside className="space-y-4 md:sticky md:top-0 md:self-start">
                  <DetailMetric
                    label="Dados do Stencil"
                    value={detail.stencil_code}
                  />

                  <DetailMetric
                    label="Total de Lavagens Registradas"
                    value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
                  />

                  <div className="space-y-3 border-t pt-4">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Dados cadastrais
                    </p>
                    <DetailMetric
                      label="Código Stencil"
                      value={detail.stencil_code}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <DetailMetric
                        label="Endereçamento"
                        value={String(detail.addressing ?? "").padStart(3, "0")}
                      />
                      <DetailMetric
                        label="Espessura"
                        value={
                          detail.asset?.thickness != null
                            ? Number(detail.asset.thickness).toFixed(2)
                            : "-"
                        }
                      />
                      <DetailMetric
                        label="ID Fabricante"
                        value={detail.asset?.manufacture_id || "-"}
                      />
                      <DetailMetric
                        label="País de Origem"
                        value={detail.asset?.country || "-"}
                      />
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 space-y-4">
                  <div className="rounded-sm bg-[#DBEBFB] p-4">
                    <p className="mb-2 text-[11px] font-medium text-[#2563A8]">
                      Dados desta lavagem
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.7fr_1.2fr_0.8fr]">
                      <DetailMetric label="ID Lavagem" value={detail.id} />
                      <DetailMetric
                        label="Data"
                        value={formatDate(detail.created_at)}
                      />
                      <DetailMetric
                        label="Hora"
                        value={formatTime(detail.created_at)}
                      />
                      <DetailMetric
                        label="Operador"
                        value={detail.operator || "-"}
                      />
                      <DetailMetric
                        label="Linha"
                        value={detail.line_name || "-"}
                      />
                    </div>
                  </div>

                  <div className="rounded-sm border bg-white p-4">
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                      Dados da última lavagem
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.7fr_1.2fr_0.8fr]">
                      <DetailMetric
                        label="ID Lavagem"
                        value={detail.asset?.last_wash_details?.id ?? "-"}
                      />
                      <DetailMetric
                        label="Data"
                        value={formatDate(detail.asset?.last_wash)}
                      />
                      <DetailMetric
                        label="Hora"
                        value={formatTime(detail.asset?.last_wash)}
                      />
                      <DetailMetric
                        label="Operador"
                        value={detail.asset?.last_wash_details?.operator ?? "-"}
                      />
                      <DetailMetric
                        label="Linha"
                        value={detail.line_name || "-"}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Select
                      value={String(analyticsDays)}
                      onValueChange={(value) =>
                        onAnalyticsDaysChange(Number(value) as AnalyticsDays)
                      }
                    >
                      <SelectTrigger className="h-8 w-[142px] rounded-sm text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANALYTICS_DAY_OPTIONS.map((days) => (
                          <SelectItem key={days} value={String(days)}>
                            Últimos {days} dias
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {analyticsLoading ? (
                    <div className="grid h-[245px] place-items-center rounded-md border bg-white text-sm text-muted-foreground">
                      Carregando gráficos...
                    </div>
                  ) : analyticsError || !analytics ? (
                    <div className="grid h-[245px] place-items-center rounded-md border bg-white px-4 text-center text-sm text-muted-foreground">
                      {analyticsError ||
                        "Não foi possível carregar os gráficos."}
                    </div>
                  ) : analytics.counts.total === 0 ? (
                    <div className="grid h-[245px] place-items-center rounded-md border bg-white text-sm text-muted-foreground">
                      Nenhuma lavagem encontrada nos últimos{" "}
                      {analytics.period.days} dias.
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 p-5">
                        <WashTimeChart analytics={analytics} />
                        <WashIntervalChart analytics={analytics} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {detail && analytics && (
        <ExportReportDialog
          detail={detail}
          analytics={analytics}
          format={exportFormat}
          open={exportOpen}
          onFormatChange={onExportFormatChange}
          onOpenChange={onExportOpenChange}
          onExport={onExport}
        />
      )}
    </>
  );
}

function ExportReportDialog({
  detail,
  analytics,
  format,
  open,
  onFormatChange,
  onOpenChange,
  onExport,
}: {
  detail: ApiStencil;
  analytics: StencilWashAnalytics;
  format: ExportFormat;
  open: boolean;
  onFormatChange: (format: ExportFormat) => void;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
}) {
  const formats: Array<{ value: ExportFormat; label: string }> = [
    { value: "pdf", label: "PDF" },
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] rounded-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Exportar relatório individual</DialogTitle>
        </DialogHeader>
        <div className="grid min-h-[520px] grid-cols-[1fr_180px] bg-white">
          <div className="grid place-items-center bg-[#565656] p-6">
            <div className="w-full max-w-[520px] rounded-sm bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-bold">Informações detalhadas</p>
                <p className="text-[10px] text-muted-foreground">
                  Últimos {analytics.period.days} dias
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-sm bg-[#DBEBFB] p-3">
                  <p className="text-[10px] font-medium text-[#2563A8]">
                    Dados desta lavagem
                  </p>
                  <div className="mt-2 space-y-2">
                    <DetailMetric
                      label="ID Lavagem"
                      value={detail.id}
                      className="[&_p:last-child]:break-all [&_p:last-child]:text-[16px]"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <DetailMetric
                        label="Data"
                        value={formatDate(detail.created_at)}
                      />
                      <DetailMetric
                        label="Hora"
                        value={formatTime(detail.created_at)}
                      />
                      <DetailMetric
                        label="Linha"
                        value={detail.line_name || "-"}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_130px] gap-3 rounded-sm border p-3">
                  <div>
                    <p className="text-[12px] font-bold">
                      Horário de lavagens por dia
                    </p>
                    <AnalyticsLegend />
                    <div className="mt-3 h-[120px] rounded-sm bg-[#F8FAFC] p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
                        >
                          <CartesianGrid stroke="#ECEFF3" vertical={false} />
                          <XAxis dataKey="day_index" type="number" hide />
                          <YAxis
                            dataKey="hour_decimal"
                            type="number"
                            hide
                            domain={[7, 17]}
                          />
                          <Scatter
                            data={analytics.time_points}
                            isAnimationActive={false}
                          >
                            {analytics.time_points.map((point) => (
                              <Cell
                                key={point.id}
                                fill={WASH_CATEGORY_META[point.category].color}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <AnalyticsCounters analytics={analytics} />
                </div>
                <div className="rounded-sm border p-3">
                  <p className="text-[12px] font-bold">
                    Intervalo entre lavagens
                  </p>
                  <div className="mt-2 h-[120px] rounded-sm bg-[#F8FAFC] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.interval_bars.map((bar) => ({
                          ...bar,
                          interval_hours:
                            bar.interval_minutes == null
                              ? 0
                              : Math.max(bar.interval_minutes / 60, 0.25),
                        }))}
                        margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
                      >
                        <XAxis dataKey="day_index" type="number" hide />
                        <YAxis hide />
                        <Bar
                          dataKey="interval_hours"
                          radius={[2, 2, 0, 0]}
                          barSize={6}
                        >
                          {analytics.interval_bars.map((bar) => (
                            <Cell
                              key={bar.date_key}
                              fill={WASH_CATEGORY_META[bar.category].color}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <aside className="flex flex-col border-l bg-white p-5">
            <p className="text-[12px] font-bold text-foreground">Formato</p>
            <div className="mt-4 space-y-3">
              {formats.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 text-[12px]"
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={item.value}
                    checked={format === item.value}
                    onChange={() => onFormatChange(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="mt-auto grid gap-2">
              <Button
                type="button"
                className="h-9 rounded-sm bg-[#1D55D8] text-[12px] text-white hover:bg-[#1649BD]"
                // onClick={onExport}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Exportar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-sm text-[12px]"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlateDetailsModal({
  detail,
  loading,
  open,
  onOpenChange,
}: {
  detail: ApiPlate | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-[790px] overflow-y-auto rounded-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Informações detalhadas da placa</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between pr-8">
            <h2 className="text-[17px] font-bold">Informações detalhadas</h2>
          </div>

          {loading || !detail ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando histórico...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr]">
                <DetailMetric label="Modelo" value={detail.plate_model} />
                <DetailMetric label="Serial" value={detail.serial} />
                <DetailMetric label="Blank ID" value={detail.blank_id} />
                <DetailMetric label="Linha" value={detail.line} />
              </div>

              <DetailMetric
                label="Total de Lavagens Registradas"
                value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
                className="mt-5"
              />

              <div className="mt-4 rounded-md border bg-white p-4">
                <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                  Dados da lavagem
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <DetailMetric
                    label="ID Lavagem"
                    value={detail.id}
                    className="col-span-3"
                  />
                  <DetailMetric
                    label="Data"
                    value={formatDate(detail.created_at)}
                  />
                  <DetailMetric
                    label="Hora"
                    value={formatTime(detail.created_at)}
                  />
                  <DetailMetric label="Turno" value={detail.shift} />
                  <DetailMetric
                    label="Operador"
                    value={detail.operator || "-"}
                  />
                </div>
              </div>

              <div className="mt-6 h-[245px] rounded-xl bg-[#d9d9d9]" />
              <div className="mt-4 h-[72px] rounded-xl bg-[#d9d9d9]" />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const History = () => {
  const [assetType, setAssetType] = useState<AssetType>("stencil");
  const [stencilFilters, setStencilFilters] =
    useState<HistoryStencilFilters>(emptyStencilFilters);
  const [plateFilters, setPlateFilters] =
    useState<HistoryPlateFilters>(emptyPlateFilters);
  const [stencils, setStencils] = useState<ApiStencil[]>([]);
  const [plates, setPlates] = useState<ApiPlate[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [sort, setSort] = useState<SortDirection>("desc");
  const [stencilPage, setStencilPage] = useState(1);
  const [platePage, setPlatePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStencil, setSelectedStencil] = useState<ApiStencil | null>(
    null,
  );
  const [stencilAnalytics, setStencilAnalytics] =
    useState<StencilWashAnalytics | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<ApiPlate | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsDays, setAnalyticsDays] = useState<AnalyticsDays>(30);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [detailType, setDetailType] = useState<AssetType | null>(null);

  const sortedStencils = useMemo(
    () => sortByWashDate(stencils, sort),
    [stencils, sort],
  );
  const sortedPlates = useMemo(
    () => sortByWashDate(plates, sort),
    [plates, sort],
  );
  const stencilPages = Math.max(
    1,
    Math.ceil(sortedStencils.length / PAGE_SIZE),
  );
  const platePages = Math.max(1, Math.ceil(sortedPlates.length / PAGE_SIZE));
  const stencilRows = useMemo(
    () =>
      sortedStencils.slice(
        (stencilPage - 1) * PAGE_SIZE,
        stencilPage * PAGE_SIZE,
      ),
    [sortedStencils, stencilPage],
  );
  const plateRows = useMemo(
    () =>
      sortedPlates.slice((platePage - 1) * PAGE_SIZE, platePage * PAGE_SIZE),
    [sortedPlates, platePage],
  );

  const loadRows = async () => {
    setLoading(true);
    setError("");

    try {
      if (assetType === "stencil") {
        setStencils(await historyApi.getStencilWashes(stencilFilters));
        setStencilPage(1);
      } else {
        setPlates(await historyApi.getPlateWashes(plateFilters));
        setPlatePage(1);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao buscar histórico.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    historyApi
      .getLines()
      .then(setLines)
      .catch(() => setLines([]));
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType]);

  useEffect(() => {
    setStencilPage(1);
    setPlatePage(1);
  }, [sort]);

  const loadStencilAnalytics = async (
    stencilId: string,
    days: AnalyticsDays,
  ) => {
    setStencilAnalytics(null);
    setAnalyticsError("");
    setAnalyticsLoading(true);

    try {
      setStencilAnalytics(
        await historyApi.getStencilWashAnalytics(stencilId, days),
      );
    } catch {
      setStencilAnalytics(null);
      setAnalyticsError("Não foi possível carregar os gráficos deste stencil.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openStencil = async (row: ApiStencil) => {
    setDetailType("stencil");
    setSelectedStencil(row);
    setDetailsLoading(false);
    setExportOpen(false);
    await loadStencilAnalytics(row.stencil_id, analyticsDays);
  };

  const changeAnalyticsDays = (days: AnalyticsDays) => {
    setAnalyticsDays(days);
    if (selectedStencil) {
      void loadStencilAnalytics(selectedStencil.stencil_id, days);
    }
  };

  const exportStencilReport = async () => {
    if (!selectedStencil || !stencilAnalytics) return;

    const report = document.getElementById("stencil-report-content");
    if (!report) return;

    try {
      if (exportFormat === "pdf") {
        exportElementAsPdf(report, selectedStencil);
      } else {
        await exportElementAsImage(
          report,
          getReportFileName(selectedStencil, exportFormat),
          exportFormat,
        );
      }
      setExportOpen(false);
    } catch {
      window.alert("Não foi possível exportar o relatório neste formato.");
    }
  };

  const openPlate = (row: ApiPlate) => {
    setDetailType("placa");
    setSelectedPlate(row);
    setDetailsLoading(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden px-4 pr-[310px] py-3">
          <section className="shrink-0">
            <h1 className="text-[24px] mt-5 font-bold leading-tight">
              Histórico de Lavagens
            </h1>
            <p className="mt-1 text-[18px] text-muted-foreground">
              Adicione uma ou mais informações para filtrar.
            </p>

            <div className="mt-4 grid gap-3">
              <AssetTypeSelect
                value={assetType}
                onChange={(value) => {
                  setAssetType(value);
                  setError("");
                }}
              />
              {assetType === "stencil" ? (
                <StencilFiltersForm
                  filters={stencilFilters}
                  lines={lines}
                  onChange={setStencilFilters}
                  onSearch={loadRows}
                />
              ) : (
                <PlateFiltersForm
                  filters={plateFilters}
                  lines={lines}
                  onChange={setPlateFilters}
                  onSearch={loadRows}
                />
              )}
            </div>
          </section>

          {error && (
            <div className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="min-h-0 min-w-0 flex-1 overflow-auto">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Carregando histórico...
                </div>
              ) : assetType === "stencil" ? (
                <StencilTable
                  rows={stencilRows}
                  allRows={sortedStencils}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onConsult={openStencil}
                />
              ) : (
                <PlateTable
                  rows={plateRows}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onConsult={openPlate}
                />
              )}
            </div>

            <div className="shrink-0">
              {assetType === "stencil" ? (
                <Pagination
                  page={stencilPage}
                  totalPages={stencilPages}
                  onChange={setStencilPage}
                  variant="stencil"
                />
              ) : (
                <Pagination
                  page={platePage}
                  totalPages={platePages}
                  onChange={setPlatePage}
                  variant="placas"
                />
              )}
            </div>
          </section>
        </main>
      </div>

      <StencilDetailsModal
        open={
          detailType === "stencil" &&
          (detailsLoading || Boolean(selectedStencil))
        }
        loading={detailsLoading}
        detail={selectedStencil}
        analytics={stencilAnalytics}
        analyticsLoading={analyticsLoading}
        analyticsError={analyticsError}
        analyticsDays={analyticsDays}
        exportOpen={exportOpen}
        exportFormat={exportFormat}
        onAnalyticsDaysChange={changeAnalyticsDays}
        onExportOpenChange={setExportOpen}
        onExportFormatChange={setExportFormat}
        onExport={exportStencilReport}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStencil(null);
            setStencilAnalytics(null);
            setAnalyticsError("");
            setExportOpen(false);
            setDetailType(null);
          }
        }}
      />
      <PlateDetailsModal
        open={
          detailType === "placa" && (detailsLoading || Boolean(selectedPlate))
        }
        loading={detailsLoading}
        detail={selectedPlate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlate(null);
            setDetailType(null);
          }
        }}
      />
    </div>
  );
};

export default History;
