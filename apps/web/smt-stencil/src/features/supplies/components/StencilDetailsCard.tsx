import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { HistoryStencilSummary } from "@/lib/api";
import {
  approvalLabels,
  stencilStatusLabels,
  technicalOpinionLabels,
} from "../stencilRules";

const statusClassNames: Record<string, string> = {
  active: "border-[#2B8E37] bg-[#BCF0DA]",
  validation: "border-[#FCE96A] bg-[#FCE96A]",
  discarded: "border-[#DB0101] bg-[#FBD5D5]",
  obsolete: "border-[#3F83F8] bg-[#E1EFFE]",
};

export function StencilStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium text-[#0A0A0A]",
        statusClassNames[status] ?? statusClassNames.validation,
      )}
    >
      {stencilStatusLabels[status as keyof typeof stencilStatusLabels] ??
        status}
    </span>
  );
}

export function StencilDetailsCard({
  stencil,
  codeLabel = "Código do Stencil",
}: {
  stencil: HistoryStencilSummary;
  codeLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] p-6">
      <DetailValue
        className="mb-8"
        label={codeLabel}
        value={stencil.stencilCode}
        prominent
      />

      <div className="grid grid-cols-5 gap-x-8 gap-y-8">
        <DetailValue label="Modelo de placa" value={stencil.plate_model} />
        <DetailValue label="Tipo de placa" value={stencil.plate_type} />
        <DetailValue label="Versão" value={stencil.version} />
        <DetailValue label="Fase" value={stencil.phase} />
        <DetailValue label="Cópia" value={stencil.copy} />
        <DetailValue label="País de origem" value={stencil.country} />
        <DetailValue label="Fabricante" value={stencil.manufacture_id} />
        <DetailValue label="Espessura" value={stencil.thickness} />
        <DetailValue
          label="Data de fabricação"
          value={formatDate(stencil.manufactured_at)}
        />
        <DetailValue label="Endereçamento" value={stencil.eddressing} />
        <DetailValue
          label="Status"
          value={<StencilStatusBadge status={stencil.status} />}
        />
        <DetailValue
          label="Serigrafia"
          value={approvalLabels[stencil.serigraphy] ?? "-"}
        />
        <DetailValue
          label="Fiduciais"
          value={approvalLabels[stencil.fiducials] ?? "-"}
        />
        <DetailValue
          label="Acabamento"
          value={approvalLabels[stencil.finishing] ?? "-"}
        />
        <DetailValue
          label="Parecer técnico"
          value={technicalOpinionLabels[stencil.technical_opinion] ?? "-"}
        />
      </div>
    </div>
  );
}

function DetailValue({
  label,
  value,
  prominent = false,
  className,
}: {
  label: string;
  value: ReactNode;
  prominent?: boolean;
  className?: string;
}) {
  const normalizedValue =
    value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className={className}>
      <p className="mb-2 text-[18px] leading-6 text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "break-words text-[20px] font-semibold leading-7 text-[#0A0A0A]",
          prominent && "text-[26px] leading-8",
        )}
      >
        {normalizedValue}
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}
