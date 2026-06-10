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
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as UiTooltip,
} from "@/components/ui/tooltip";
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
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  CircleAlert,
  Download,
  EqualApproximately,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
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
type AnalyticsDays = 7 | 15 | 30 | 60 | 90;
type ExportFormat = "pdf" | "png" | "jpeg";

const PAGE_SIZE = 9;
const ANALYTICS_DAY_OPTIONS: AnalyticsDays[] = [7, 15, 30, 60, 90];
const ANOMALOUS_ROW_COLOR = "#DB0101";
const MULTIPLE_ROW_COLOR = "#9061F9";

const emptyStencilFilters: HistoryStencilFilters = {
  codigo: "",
  enderecamento: "",
  idFabricante: "",
  pais: "",
  operador: "",
  ocorrencia: "",
  status: "",
  linha: "",
  dataDe: "",
  dataAte: "",
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
  if (row.occurrence) return row.occurrence;

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

function ModalMetric({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[16px] leading-[1.25] text-[#71717A]">{label}</p>
      <p
        className={cn(
          "mt-2 break-words text-[25px] font-bold leading-[1.08] text-[#111318]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

const WASH_CATEGORY_META: Record<
  WashAnalyticsCategory,
  {
    label: string;
    color: string;
    soft: string;
    shape: "circle" | "square" | "triangle";
  }
> = {
  planned: {
    label: "Planejada",
    color: "#10B981",
    soft: "bg-emerald-50 text-emerald-700",
    shape: "circle",
  },
  anomalous: {
    label: "Anômala",
    color: "#EF4444",
    soft: "bg-red-50 text-red-700",
    shape: "square",
  },
  multiple: {
    label: "Múltipla",
    color: "#8B5CF6",
    soft: "bg-violet-50 text-violet-700",
    shape: "triangle",
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

type IntervalStatus = "compliant" | "under" | "over";

const INTERVAL_STATUS_META: Record<
  IntervalStatus,
  { label: string; color: string }
> = {
  compliant: { label: "Conforme", color: "#10A672" },
  under: { label: "Intervalo <24h", color: "#E5252A" },
  over: { label: "Intervalo >24h", color: "#F6C515" },
};

function getIntervalStatus(minutes: number | null): IntervalStatus {
  if (minutes == null || minutes === 24 * 60) return "compliant";
  return minutes < 24 * 60 ? "under" : "over";
}

function getReportFileName(detail: ApiStencil, format: ExportFormat) {
  const date = new Intl.DateTimeFormat("pt-BR")
    .format(new Date())
    .replace(/\//g, "-");
  return `relatorio-stencil-${detail.stencil_code}-${date}.${format}`;
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
  format: "png" | "jpeg",
) {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    logging: false,
    scale: 1.5,
    useCORS: true,
    windowWidth: 1630,
    onclone: (documentClone) => {
      const clonedModal = documentClone.getElementById(element.id);
      if (!clonedModal) return;

      clonedModal.style.position = "static";
      clonedModal.style.transform = "none";
      clonedModal.style.width = "1630px";
      clonedModal.style.maxWidth = "none";
      clonedModal.style.height = "auto";
      clonedModal.style.maxHeight = "none";
      clonedModal.style.overflow = "visible";

      clonedModal
        .querySelectorAll<HTMLElement>("[data-export-scroll]")
        .forEach((scrollContainer) => {
          scrollContainer.style.height = "auto";
          scrollContainer.style.maxHeight = "none";
          scrollContainer.style.overflow = "visible";
        });
    },
  });

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92),
  );

  if (!blob) throw new Error("Não foi possível gerar o arquivo.");
  downloadBlob(blob, fileName);
}

async function exportElementAsPdf(
  element: HTMLElement,
  detail: ApiStencil,
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    logging: false,
    scale: 2,
    useCORS: true,
  });
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const margin = 8;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const renderedHeight = (canvas.height * contentWidth) / canvas.width;
  const pageContentHeight = pageHeight - margin * 2;
  const image = canvas.toDataURL("image/png");
  const pageCount = Math.max(1, Math.ceil(renderedHeight / pageContentHeight));

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) pdf.addPage();
    pdf.addImage(
      image,
      "PNG",
      margin,
      margin - page * pageContentHeight,
      contentWidth,
      renderedHeight,
      undefined,
      "FAST",
    );
  }

  pdf.save(getReportFileName(detail, "pdf"));
}

function AnalyticsLegend({ large = false }: { large?: boolean }) {
  return (
    <div
      className={cn(
        "flex-wrap items-center text-muted-foreground",
        large
          ? "inline-flex gap-5 rounded-md bg-[#F4F4F5] px-2.5 py-2 text-[16px]"
          : "flex gap-4 text-[11px]",
      )}
    >
      {(["planned", "anomalous", "multiple"] as WashAnalyticsCategory[]).map(
        (category) => (
          <span key={category} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                large ? "h-4 w-4" : "h-2.5 w-2.5",
                WASH_CATEGORY_META[category].shape === "circle" &&
                  "rounded-full",
              )}
              style={{
                backgroundColor: WASH_CATEGORY_META[category].color,
                clipPath:
                  WASH_CATEGORY_META[category].shape === "triangle"
                    ? "polygon(50% 0, 100% 100%, 0 100%)"
                    : undefined,
              }}
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
  large = false,
}: {
  analytics: StencilWashAnalytics;
  compact?: boolean;
  large?: boolean;
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
        "grid",
        large ? "content-center gap-5" : "gap-3",
        compact ? "grid-cols-3" : "min-w-[150px] content-center",
      )}
    >
      {rows.map((row) => (
        <div
          key={row.category}
          className={cn(
            "border-l-2",
            large ? "min-h-[92px] pl-5" : "pl-3",
            compact && "min-w-0 border-l-0 border-t-2 pl-0 pt-2",
          )}
          style={{ borderColor: WASH_CATEGORY_META[row.category].color }}
        >
          <p
            className={cn(
              "leading-tight text-muted-foreground",
              large ? "text-[16px]" : "text-[10px]",
            )}
          >
            {row.label}
          </p>
          <p
            className={cn(
              "font-bold leading-none",
              large ? "mt-3 text-[34px]" : "mt-1 text-[24px]",
            )}
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
  const status = getIntervalStatus(bar.interval_minutes);

  return (
    <div className="rounded bg-[#202124] px-2 py-1.5 text-[10px] font-medium text-white shadow">
      <p>{bar.day_label}</p>
      <p>Intervalo: {formatInterval(bar.interval_minutes)}</p>
      <p>{INTERVAL_STATUS_META[status].label}</p>
    </div>
  );
}

function WashTimeChart({
  analytics,
  selectedDays,
  onDaysChange,
  framed = true,
  large = false,
}: {
  analytics: StencilWashAnalytics;
  selectedDays?: AnalyticsDays;
  onDaysChange?: (days: AnalyticsDays) => void;
  framed?: boolean;
  large?: boolean;
}) {
  const ticks = getPeriodTicks(analytics.period.days);
  const lastDayIndex = analytics.period.days - 1;

  return (
    <div className={cn(framed && "rounded-md border bg-white p-4")}>
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3",
          large ? "mb-5" : "mb-3",
        )}
      >
        <div>
          <h3
            className={cn(
              "font-bold leading-tight text-[#111318]",
              large ? "text-[25px]" : "text-[14px]",
            )}
          >
            Horário de lavagens por dia
          </h3>
          <div className={large ? "mt-3" : "mt-2"}>
            <AnalyticsLegend large={large} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedDays && onDaysChange && (
            <Select
              value={String(selectedDays)}
              onValueChange={(value) =>
                onDaysChange(Number(value) as AnalyticsDays)
              }
            >
              <SelectTrigger
                className={cn(
                  "rounded-md",
                  large
                    ? "h-10 w-[166px] text-[14px]"
                    : "h-8 w-[138px] text-[11px]",
                )}
              >
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
          )}
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md border text-[#52525B]",
              large ? "h-10 px-3 text-[14px]" : "px-2 py-1.5 text-[10px]",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            {formatPeriodRange(analytics.period.start, analytics.period.end)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "grid",
          large
            ? "gap-7 md:grid-cols-[minmax(0,1fr)_225px]"
            : "gap-4 md:grid-cols-[1fr_150px]",
        )}
      >
        <div className={cn("min-w-0", large ? "h-[405px]" : "h-[230px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 14, bottom: 4, left: 2 }}>
              <CartesianGrid stroke="#ECEFF3" vertical={false} />
              <XAxis
                type="number"
                dataKey="day_index"
                domain={[0, lastDayIndex]}
                ticks={ticks}
                tickFormatter={(value) =>
                  formatDayFromPeriod(analytics.period.start, Number(value))
                }
                tick={{ fontSize: large ? 14 : 10, fill: "#71717A" }}
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
                tick={{ fontSize: large ? 14 : 10, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceArea
                y1={11}
                y2={12}
                fill="#D7F2E8"
                fillOpacity={0.9}
                strokeOpacity={0}
              />
              <ReferenceArea
                y1={16}
                y2={17}
                fill="#D7F2E8"
                fillOpacity={0.9}
                strokeOpacity={0}
              />
              <Tooltip content={<WashTimeTooltip />} cursor={false} />
              {(
                ["planned", "anomalous", "multiple"] as WashAnalyticsCategory[]
              ).map((category) => (
                <Scatter
                  key={category}
                  data={analytics.time_points.filter(
                    (point) => point.category === category,
                  )}
                  fill={WASH_CATEGORY_META[category].color}
                  shape={WASH_CATEGORY_META[category].shape}
                  isAnimationActive={false}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <AnalyticsCounters analytics={analytics} large={large} />
      </div>
    </div>
  );
}

function WashIntervalChart({
  analytics,
  large = false,
}: {
  analytics: StencilWashAnalytics;
  large?: boolean;
}) {
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
    <div>
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3",
          large ? "mb-5" : "mb-3",
        )}
      >
        <div>
          <h3
            className={cn(
              "font-bold leading-tight text-[#111318]",
              large ? "text-[25px]" : "text-[14px]",
            )}
          >
            Intervalo entre lavagens
          </h3>
          <div
            className={cn(
              "flex flex-wrap items-center text-[#71717A]",
              large ? "mt-3 gap-5 text-[14px]" : "mt-2 gap-4 text-[11px]",
            )}
          >
            {(Object.keys(INTERVAL_STATUS_META) as IntervalStatus[]).map(
              (status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5"
                    style={{
                      backgroundColor: INTERVAL_STATUS_META[status].color,
                    }}
                  />
                  {INTERVAL_STATUS_META[status].label}
                </span>
              ),
            )}
          </div>
        </div>
        <span
          className={cn(
            "rounded-md border text-[#71717A]",
            large ? "px-3 py-2 text-[14px]" : "px-2 py-1 text-[10px]",
          )}
        >
          Últimos {analytics.period.days} dias
        </span>
      </div>

      <div
        className={cn(
          "grid",
          large
            ? "gap-7 md:grid-cols-[minmax(0,1fr)_225px]"
            : "gap-4 md:grid-cols-[1fr_150px]",
        )}
      >
        <div className={cn("min-w-0", large ? "h-[360px]" : "h-[210px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bars}
              margin={{ top: 8, right: 14, bottom: 4, left: 2 }}
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
                tick={{ fontSize: large ? 14 : 10, fill: "#71717A" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value}h`}
                tick={{ fontSize: large ? 14 : 10, fill: "#71717A" }}
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
                    fill={
                      INTERVAL_STATUS_META[
                        getIntervalStatus(bar.interval_minutes)
                      ].color
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid content-center gap-4">
          <IntervalMetric
            label="Intervalo médio entre lavagens"
            value={formatInterval(
              analytics.interval_summary.average_interval_minutes,
            )}
            color="#10B981"
            large={large}
          />
          <IntervalMetric
            label="Data maior intervalo"
            value={analytics.interval_summary.longest_interval_date ?? "-"}
            color="#3B82F6"
            large={large}
          />
          <IntervalMetric
            label="Data menor intervalo"
            value={analytics.interval_summary.shortest_interval_date ?? "-"}
            color="#F97316"
            large={large}
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
  large = false,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div
      className={cn("border-l-2", large ? "min-h-[92px] pl-5" : "pl-3")}
      style={{ borderColor: color }}
    >
      <p
        className={cn(
          "leading-tight text-muted-foreground",
          large ? "text-[16px]" : "text-[10px]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-bold leading-none",
          large ? "mt-3 text-[34px]" : "mt-1 text-[20px]",
        )}
        style={{ color }}
      >
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
  onClear,
}: {
  filters: HistoryStencilFilters;
  lines: string[];
  onChange: (filters: HistoryStencilFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Código">
        <Input
          value={filters.codigo}
          onChange={(event) =>
            onChange({ ...filters, codigo: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Endereçamento">
        <Input
          value={filters.enderecamento}
          onChange={(event) =>
            onChange({ ...filters, enderecamento: event.target.value })
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
      <Field label="Operador de lavagem">
        <Input
          value={filters.operador}
          onChange={(event) =>
            onChange({ ...filters, operador: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Tipo de ocorrência">
        <Select
          value={filters.ocorrencia || "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              ocorrencia:
                value === "all"
                  ? ""
                  : (value as HistoryStencilFilters["ocorrencia"]),
            })
          }
        >
          <SelectTrigger className="h-10 rounded-md bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="planned">Planejada</SelectItem>
            <SelectItem value="anomalous">Anômala</SelectItem>
            <SelectItem value="multiple">Múltipla</SelectItem>
          </SelectContent>
        </Select>
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
      <Field label="De">
        <Input
          type="date"
          value={filters.dataDe}
          onChange={(event) =>
            onChange({ ...filters, dataDe: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Field label="Até">
        <Input
          type="date"
          value={filters.dataAte}
          onChange={(event) =>
            onChange({ ...filters, dataAte: event.target.value })
          }
          className="h-10 rounded-md bg-white text-[13px]"
        />
      </Field>
      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        className="h-10 justify-start gap-2 px-2 text-[13px]"
      >
        <X className="h-4 w-4" />
        Limpar filtros
      </Button>
    </div>
  );
}

function formatPeriodRange(startIso: string, endIso: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Manaus",
  });
  const normalize = (value: string) => {
    const formatted = formatter
      .format(new Date(value))
      .replace(".", "")
      .replace(" de ", " ");
    const [day, month = ""] = formatted.split(" ");

    return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  };

  return `${normalize(startIso)} - ${normalize(endIso)}`;
}

function PlateFiltersForm({
  filters,
  lines,
  onChange,
  onClear,
}: {
  filters: HistoryPlateFilters;
  lines: string[];
  onChange: (filters: HistoryPlateFilters) => void;
  onClear: () => void;
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
        variant="ghost"
        onClick={onClear}
        className="h-10 justify-start gap-2 px-2 text-[13px]"
      >
        <X className="h-4 w-4" />
        Limpar filtros
      </Button>
    </div>
  );
}

function StencilTable({
  rows,
  allRows,
  sort,
  onToggleSort,
  onOpen,
}: {
  rows: ApiStencil[];
  allRows: ApiStencil[];
  sort: SortDirection;
  onToggleSort: () => void;
  onOpen: (row: ApiStencil) => void;
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
                tabIndex={0}
                role="button"
                onClick={() => onOpen(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(row);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
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
                  {category !== "planned" && (
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-grid h-8 w-8 place-items-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <AlertTriangle
                              className="h-5 w-5"
                              style={{ color }}
                              aria-label="Lavagem com anomalia"
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {category === "multiple"
                            ? "Múltiplas lavagens registradas no mesmo dia"
                            : "Lavagem realizada fora do horário planejado"}
                        </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                  )}
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
  onOpen,
}: {
  rows: ApiPlate[];
  sort: SortDirection;
  onToggleSort: () => void;
  onOpen: (row: ApiPlate) => void;
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
              tabIndex={0}
              role="button"
              onClick={() => onOpen(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(row);
                }
              }}
              className={cn(
                "cursor-pointer transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                index % 2 === 0 ? "bg-white" : "bg-[#E5E5E5]",
              )}
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
              <td className="px-3 py-2 text-center" />
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
  onExport: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}) {
  const canExport = Boolean(detail && analytics && !analyticsLoading);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          id="stencil-report-modal"
          className="block h-[min(892px,calc(100vh-100px))] w-[min(1630px,calc(100vw-100px))] max-w-none gap-0 overflow-hidden rounded-lg border-[#E4E4E7] bg-white p-0 shadow-xl [&>button]:right-6 [&>button]:top-[25px] [&>button]:h-7 [&>button]:w-7 [&>button]:rounded-none [&>button]:opacity-100 [&>button]:outline-none [&>button]:ring-0 [&>button]:ring-offset-0 [&>button]:focus:outline-none [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button_svg]:h-5 [&>button_svg]:w-5"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Informações detalhadas do stencil</DialogTitle>
          </DialogHeader>
          <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-[#F1F1F2] px-8 pr-[70px]">
            <div className="flex items-center gap-5">
              <MoreHorizontal className="h-5 w-5 text-[#52525B]" />
              <h2 className="text-[20px] font-semibold text-[#111318]">
                Informações detalhadas
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canExport}
                onClick={() => onExportOpenChange(true)}
                className="h-10 gap-2 rounded-md border-[#D4D4D8] bg-white px-4 text-[14px] font-medium text-[#18181B] shadow-none"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </header>

          <div
            data-export-scroll
            className="h-[calc(100%_-_74px)] overflow-y-auto bg-white px-6 py-5"
          >
            {loading || !detail ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Carregando histórico...
              </div>
            ) : (
              <div
                id="stencil-report-content"
                className="grid gap-7 bg-white xl:grid-cols-[370px_minmax(0,1fr)]"
              >
                <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                  <p className="text-[16px] text-[#71717A]">Dados do Stencil</p>

                  <div>
                    <p className="text-[16px] leading-tight text-[#71717A]">
                      Estimativa de uso
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="inline-grid h-7 w-7 place-items-center rounded bg-[#FEF3C7] text-[#D8A800]">
                        <EqualApproximately className="h-5 w-5" />
                      </span>
                      <p className="text-[25px] font-bold leading-none text-[#DC2626]">
                        Não informado
                      </p>
                      <CircleAlert className="h-5 w-5 text-[#FB7185]" />
                    </div>
                  </div>

                  <ModalMetric
                    label="Total de Lavagens Registradas"
                    value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
                  />

                  <div className="space-y-4 border-t border-[#E4E4E7] pt-6">
                    <p className="text-[17px] text-[#71717A]">
                      Dados cadastrais
                    </p>
                    <ModalMetric
                      label="Código Stencil"
                      value={detail.stencil_code}
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-7">
                      <ModalMetric
                        label="Endereçamento"
                        value={String(detail.addressing ?? "").padStart(3, "0")}
                      />
                      <ModalMetric
                        label="Espessura"
                        value={
                          detail.asset?.thickness != null
                            ? Number(detail.asset.thickness).toFixed(2)
                            : "-"
                        }
                      />
                      <ModalMetric
                        label="ID Fabricante"
                        value={detail.asset?.manufacture_id || "-"}
                      />
                      <ModalMetric
                        label="País de Origem"
                        value={detail.asset?.country || "-"}
                      />
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 space-y-6">
                  <section className="overflow-hidden rounded-lg border border-[#E4E4E7] bg-white">
                    <div className="bg-[#DCEBFA] px-5 py-5">
                      <p className="mb-4 text-[16px] text-[#2155A3]">
                        Dados desta lavagem
                      </p>
                      <div className="grid gap-5 md:grid-cols-[1.25fr_0.8fr_0.6fr_1.15fr_0.65fr]">
                        <ModalMetric
                          label="ID Lavagem"
                          value={detail.id}
                          valueClassName="break-all text-[18px] leading-[1.15]"
                        />
                        <ModalMetric
                          label="Data"
                          value={formatDate(detail.created_at)}
                        />
                        <ModalMetric
                          label="Hora"
                          value={formatTime(detail.created_at)}
                        />
                        <ModalMetric
                          label="Operador de Lavagem"
                          value={detail.operator || "-"}
                        />
                        <ModalMetric
                          label="Linha"
                          value={detail.line_name || "-"}
                        />
                      </div>
                    </div>
                    <div className="border-t border-[#E4E4E7] px-5 py-7">
                      <p className="mb-5 text-[16px] text-[#71717A]">
                        Dados da última lavagem
                      </p>
                      <div className="grid gap-5 md:grid-cols-[1.25fr_0.8fr_0.6fr_1.15fr_0.65fr]">
                        <ModalMetric
                          label="ID Lavagem"
                          value={detail.asset?.last_wash_details?.id ?? "-"}
                          valueClassName="break-all text-[18px] leading-[1.15]"
                        />
                        <ModalMetric
                          label="Data"
                          value={formatDate(detail.asset?.last_wash)}
                        />
                        <ModalMetric
                          label="Hora"
                          value={formatTime(detail.asset?.last_wash)}
                        />
                        <ModalMetric
                          label="Operador de Lavagem"
                          value={
                            detail.asset?.last_wash_details?.operator ?? "-"
                          }
                        />
                        <ModalMetric
                          label="Linha"
                          value={detail.line_name || "-"}
                        />
                      </div>
                    </div>
                  </section>

                  <div className="inline-flex h-10 items-center rounded-md bg-[#F4F4F5] px-4 text-[16px] font-medium text-[#27272A]">
                    Gráficos de intervalo
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
                    <section className="rounded-lg border border-[#E4E4E7] bg-white px-4 py-5">
                      <WashTimeChart
                        analytics={analytics}
                        selectedDays={analyticsDays}
                        onDaysChange={onAnalyticsDaysChange}
                        framed={false}
                        large
                      />
                      <div className="my-7 border-t border-[#E4E4E7]" />
                      <div className="px-0">
                        <WashIntervalChart analytics={analytics} large />
                      </div>
                    </section>
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
  onExport: () => Promise<void>;
}) {
  const [exporting, setExporting] = useState(false);
  const formats: Array<{ value: ExportFormat; label: string }> = [
    { value: "pdf", label: "PDF" },
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
  ];
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!exporting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="h-[min(868px,calc(100vh-64px))] w-[min(1176px,calc(100vw-64px))] max-w-none overflow-hidden rounded-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Exportar</DialogTitle>
        </DialogHeader>
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_230px] bg-white">
          <div className="min-h-0 overflow-y-auto overflow-x-auto bg-[#565656] p-7">
            <div className="mx-auto w-[794px] shadow-xl">
              <StencilPdfReport detail={detail} analytics={analytics} />
            </div>
          </div>
          <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l bg-white p-6">
            <p className="text-[16px] font-bold text-foreground">Formato</p>
            <div className="mt-6 space-y-4">
              {formats.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-3 text-[14px]"
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
            <div className="mt-auto grid shrink-0 gap-2 pt-6">
              <Button
                type="button"
                disabled={exporting}
                className="h-11 rounded-md bg-[#1D55D8] text-[14px] text-white hover:bg-[#1649BD]"
                onClick={() => void handleExport()}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                {exporting ? "Gerando..." : "Exportar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={exporting}
                className="h-10 rounded-md text-[13px]"
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

function PdfMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 border-l border-[#A3A3A3] px-3 py-1">
      <p className="text-[8px] font-bold uppercase leading-tight">{label}</p>
      <p className="mt-1 break-words text-[12px] font-bold leading-tight">
        {value}
      </p>
    </div>
  );
}

function StencilPdfReport({
  detail,
  analytics,
}: {
  detail: ApiStencil;
  analytics: StencilWashAnalytics;
}) {
  const lastWash = detail.asset?.last_wash_details;

  return (
    <article
      id="stencil-pdf-report"
      className="w-[794px] bg-white p-6 text-foreground"
    >
      <div className="border-t-[26px] border-[#737373] pt-3">
        <p className="-mt-[22px] px-2 text-[10px] font-bold text-white">
          RELATÓRIO DE STENCIL
        </p>
        <h1 className="mt-4 text-[24px] font-bold">{detail.stencil_code}</h1>
      </div>

      <section className="mt-4" data-report-section="Cadastro">
        <h2 className="border-b border-black pb-1 text-[13px] font-bold uppercase">
          Cadastro
        </h2>
        <div className="mt-2 grid grid-cols-4">
          <PdfMetric label="Endereçamento" value={detail.addressing} />
          <PdfMetric
            label="Espessura"
            value={
              detail.asset?.thickness != null
                ? `${Number(detail.asset.thickness).toFixed(2)} mm`
                : "-"
            }
          />
          <PdfMetric
            label="ID fabricante"
            value={detail.asset?.manufacture_id || "-"}
          />
          <PdfMetric
            label="País de origem"
            value={detail.asset?.country || "-"}
          />
        </div>
      </section>

      <section className="mt-4" data-report-section="Produção">
        <h2 className="border-b border-black pb-1 text-[13px] font-bold uppercase">
          Produção
        </h2>
        <div className="mt-2 grid grid-cols-2">
          <PdfMetric label="Estimativa de uso" value="Não informado" />
          <PdfMetric
            label="Total de lavagens registradas"
            value={`${String(detail.asset?.total_washes ?? 0).padStart(3, "0")} lavagens`}
          />
        </div>
      </section>

      <section className="mt-4" data-report-section="Lavagens">
        <h2 className="border-b border-black pb-1 text-[13px] font-bold uppercase">
          Dados de lavagem
        </h2>
        <div className="mt-2 border-l-2 border-black py-1 pl-3">
          <p className="text-[10px] font-bold uppercase">
            Dados desta lavagem
          </p>
          <div className="mt-2 grid grid-cols-5">
            <PdfMetric label="ID lavagem" value={detail.id} />
            <PdfMetric label="Data" value={formatDate(detail.created_at)} />
            <PdfMetric label="Hora" value={formatTime(detail.created_at)} />
            <PdfMetric label="Operador" value={detail.operator || "-"} />
            <PdfMetric label="Linha" value={detail.line_name || "-"} />
          </div>
        </div>
        <div className="mt-2 border-l-2 border-[#A3A3A3] py-1 pl-3">
          <p className="text-[10px] font-bold uppercase">
            Dados da última lavagem
          </p>
          <div className="mt-2 grid grid-cols-5">
            <PdfMetric label="ID lavagem" value={lastWash?.id ?? "-"} />
            <PdfMetric
              label="Data"
              value={formatDate(detail.asset?.last_wash)}
            />
            <PdfMetric
              label="Hora"
              value={formatTime(detail.asset?.last_wash)}
            />
            <PdfMetric label="Operador" value={lastWash?.operator ?? "-"} />
            <PdfMetric label="Linha" value={detail.line_name || "-"} />
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between border-b pb-1">
          <h2 className="text-[13px] font-bold">
            Análise dos últimos {analytics.period.days} dias
          </h2>
          <span className="text-[10px]">
            {formatPeriodRange(analytics.period.start, analytics.period.end)}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          <WashTimeChart analytics={analytics} framed={false} />
          <WashIntervalChart analytics={analytics} />
        </div>
      </section>

      <section className="mt-4" data-report-section="Métricas dos gráficos">
        <h2 className="border-b border-black pb-1 text-[13px] font-bold uppercase">
          Métricas dos gráficos
        </h2>
        <div className="mt-2 grid grid-cols-3">
          <PdfMetric
            label="Lavagens planejadas"
            value={analytics.counts.planned}
          />
          <PdfMetric
            label="Lavagens anômalas"
            value={analytics.counts.anomalous}
          />
          <PdfMetric
            label="Lavagens múltiplas"
            value={analytics.counts.multiple}
          />
          <PdfMetric
            label="Intervalo médio"
            value={formatInterval(
              analytics.interval_summary.average_interval_minutes,
            )}
          />
          <PdfMetric
            label="Maior intervalo"
            value={`${analytics.interval_summary.longest_interval_date ?? "-"} — ${formatInterval(analytics.interval_summary.longest_interval_minutes)}`}
          />
          <PdfMetric
            label="Menor intervalo"
            value={`${analytics.interval_summary.shortest_interval_date ?? "-"} — ${formatInterval(analytics.interval_summary.shortest_interval_minutes)}`}
          />
        </div>
      </section>

      <section
        className="mt-4"
        data-report-section="Lista de lavagens com classificação"
      >
        <h2 className="border-b border-black pb-1 text-[13px] font-bold uppercase">
          Lista de lavagens com classificação
        </h2>
        <table className="mt-2 w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-1.5">Data</th>
              <th className="p-1.5">Hora</th>
              <th className="p-1.5">Operador</th>
              <th className="p-1.5">Classificação</th>
            </tr>
          </thead>
          <tbody>
            {analytics.time_points.map((wash) => (
              <tr key={wash.id} className="border-b">
                <td className="p-1.5">{wash.day_label}</td>
                <td className="p-1.5">{wash.time_label}</td>
                <td className="p-1.5">{wash.operator}</td>
                <td className="p-1.5">
                  {WASH_CATEGORY_META[wash.category].label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-5 flex justify-between border-t pt-2 text-[9px] text-muted-foreground">
        <span>
          Relatório gerado em {formatDate(new Date().toISOString())} às{" "}
          {formatTime(new Date().toISOString())}
        </span>
        <span>{detail.stencil_code}</span>
      </footer>
    </article>
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
  const [stencilTotalPages, setStencilTotalPages] = useState(1);
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
  const rowsRequestId = useRef(0);
  const analyticsRequestId = useRef(0);
  const rowsAbortController = useRef<AbortController | null>(null);

  const sortedStencils = useMemo(
    () => sortByWashDate(stencils, sort),
    [stencils, sort],
  );
  const sortedPlates = useMemo(
    () => sortByWashDate(plates, sort),
    [plates, sort],
  );
  const platePages = Math.max(1, Math.ceil(sortedPlates.length / PAGE_SIZE));
  const plateRows = useMemo(
    () =>
      sortedPlates.slice((platePage - 1) * PAGE_SIZE, platePage * PAGE_SIZE),
    [sortedPlates, platePage],
  );

  const loadRows = async () => {
    const requestId = ++rowsRequestId.current;
    rowsAbortController.current?.abort();
    const controller = new AbortController();
    rowsAbortController.current = controller;
    setLoading(true);
    setError("");

    try {
      if (assetType === "stencil") {
        const response = await historyApi.getStencilWashes(
          stencilFilters,
          stencilPage,
          PAGE_SIZE,
          sort,
          controller.signal,
        );
        if (requestId !== rowsRequestId.current) return;
        setStencils(response.items);
        setStencilTotalPages(response.total_pages);
      } else {
        const rows = await historyApi.getPlateWashes(plateFilters);
        if (requestId !== rowsRequestId.current) return;
        setPlates(rows);
        setPlatePage(1);
      }
    } catch (err) {
      if (requestId !== rowsRequestId.current) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Erro ao buscar histórico.",
      );
    } finally {
      if (requestId === rowsRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    historyApi
      .getLines()
      .then(setLines)
      .catch(() => setLines([]));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRows();
    }, 300);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType, stencilFilters, plateFilters, stencilPage, sort]);

  useEffect(() => {
    setStencilPage(1);
    setPlatePage(1);
  }, [stencilFilters, plateFilters]);

  const loadStencilAnalytics = async (
    stencilId: string,
    days: AnalyticsDays,
  ) => {
    const requestId = ++analyticsRequestId.current;
    setStencilAnalytics(null);
    setAnalyticsError("");
    setAnalyticsLoading(true);

    try {
      const analytics = await historyApi.getStencilWashAnalytics(
        stencilId,
        days,
      );
      if (requestId !== analyticsRequestId.current) return;
      if (analytics.period.days !== days) {
        throw new Error(
          `A API retornou ${analytics.period.days} dias para uma consulta de ${days} dias.`,
        );
      }
      setStencilAnalytics(analytics);
    } catch {
      if (requestId !== analyticsRequestId.current) return;
      setStencilAnalytics(null);
      setAnalyticsError(
        "Não foi possível aplicar o período. Atualize a API do SMT Stencil e tente novamente.",
      );
    } finally {
      if (requestId === analyticsRequestId.current) {
        setAnalyticsLoading(false);
      }
    }
  };

  const openStencil = async (row: ApiStencil) => {
    setDetailType("stencil");
    setSelectedStencil(row);
    setDetailsLoading(true);
    setExportOpen(false);
    try {
      const [detail] = await Promise.all([
        historyApi.getStencil(row.stencil_id),
        loadStencilAnalytics(row.stencil_id, analyticsDays),
      ]);
      setSelectedStencil({ ...row, asset: detail });
    } catch {
      setSelectedStencil(row);
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeAnalyticsDays = (days: AnalyticsDays) => {
    setAnalyticsDays(days);
    if (selectedStencil) {
      void loadStencilAnalytics(selectedStencil.stencil_id, days);
    }
  };

  const exportStencilReport = async () => {
    if (!selectedStencil || !stencilAnalytics) return;

    const report = document.getElementById(
      exportFormat === "pdf" ? "stencil-pdf-report" : "stencil-report-modal",
    );
    if (!report) return;

    try {
      if (exportFormat === "pdf") {
        await exportElementAsPdf(report, selectedStencil);
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
                  onClear={() => setStencilFilters({ ...emptyStencilFilters })}
                />
              ) : (
                <PlateFiltersForm
                  filters={plateFilters}
                  lines={lines}
                  onChange={setPlateFilters}
                  onClear={() => setPlateFilters({ ...emptyPlateFilters })}
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
                  rows={sortedStencils}
                  allRows={sortedStencils}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onOpen={openStencil}
                />
              ) : (
                <PlateTable
                  rows={plateRows}
                  sort={sort}
                  onToggleSort={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  onOpen={openPlate}
                />
              )}
            </div>

            <div className="shrink-0">
              {assetType === "stencil" ? (
                <Pagination
                  page={stencilPage}
                  totalPages={stencilTotalPages}
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
