import type { ReactNode } from "react";
import type { HistoryPlateSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { normalizePlatePhases, platePhaseLabels } from "../plateRules";

export function PlateDetailsCard({
  plate,
  codeLabel = "Código gerado",
}: {
  plate: HistoryPlateSummary;
  codeLabel?: string;
}) {
  const model = plate.model ?? splitPlateCode(plate.plate_model).model;
  const plateType =
    plate.plate_type ?? splitPlateCode(plate.plate_model).plateType;
  const phases = normalizePlatePhases(plate.phases);

  return (
    <div className="rounded-xl border border-[#E5E5E5] p-6">
      <DetailValue
        className="mb-8"
        label={codeLabel}
        value={plate.plate_model}
        prominent
      />

      <div className="grid grid-cols-4 gap-x-8 gap-y-8">
        <DetailValue label="Modelo de placa" value={model} />
        <DetailValue label="Tipo de placa" value={plateType} />
        <DetailValue label="Fases" value={platePhaseLabels[phases]} />
        <DetailValue
          label="Placas por blank"
          value={plate.plates_per_blank ?? 1}
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

function splitPlateCode(code: string) {
  const [model = "", plateType = ""] = code.split("_");
  return { model, plateType };
}
