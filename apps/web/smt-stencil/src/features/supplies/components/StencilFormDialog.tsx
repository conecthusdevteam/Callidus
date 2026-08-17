import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  generateStencilCode,
  getStencilFormErrors,
  hasSectionErrors,
  isChina,
  stencilStatusColors,
  stencilStatusLabels,
  type StencilStatus,
  type StencilFormValues,
} from "../stencilRules";
import {
  generatePlateCode,
  getPlateFormErrors,
  type PlateFormValues,
} from "../plateRules";

export function StencilFormDialog({
  open,
  mode,
  supplyType,
  values,
  plateValues,
  onValuesChange,
  onPlateValuesChange,
  onCancel,
  onPreview,
  onPlatePreview,
  onSupplyTypeChange,
  stencilCodeError,
  plateCodeError,
}: {
  open: boolean;
  mode: "create" | "edit";
  supplyType: "stencil" | "plate";
  values: StencilFormValues;
  plateValues: PlateFormValues;
  onValuesChange: (values: StencilFormValues) => void;
  onPlateValuesChange: (values: PlateFormValues) => void;
  onCancel: () => void;
  onPreview: (values: StencilFormValues) => void;
  onPlatePreview: (values: PlateFormValues) => void;
  onSupplyTypeChange: (type: "stencil" | "plate") => void;
  stencilCodeError?: string;
  plateCodeError?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  useEffect(() => {
    setSubmitted(false);
  }, [supplyType]);

  useEffect(() => {
    if (mode !== "create" || values.status === "validation") return;
    onValuesChange({ ...values, status: "validation" });
  }, [mode, onValuesChange, values]);

  useEffect(() => {
    if (!isChina(values.country)) return;
    if (values.manufactureId === "") return;
    onValuesChange({ ...values, manufactureId: "" });
  }, [onValuesChange, values.country, values.manufactureId]);

  const errors = useMemo(() => getStencilFormErrors(values), [values]);
  const plateErrors = useMemo(
    () => getPlateFormErrors(plateValues),
    [plateValues],
  );
  const hasErrors = Object.keys(errors).length > 0;
  const hasPlateErrors = Object.keys(plateErrors).length > 0;
  const generatedCode = generateStencilCode(values);
  const generatedPlateCode = generatePlateCode(plateValues);

  const update = (key: keyof StencilFormValues, value: string) => {
    const uppercaseFields: Array<keyof StencilFormValues> = [
      "plateModel",
      "plateType",
      "version",
      "manufactureId",
      "copy",
      "addressing",
    ];
    const nextValue = uppercaseFields.includes(key) ? value.toUpperCase() : value;
    onValuesChange({ ...values, [key]: nextValue });
  };

  const updatePlate = (key: keyof PlateFormValues, value: string) => {
    const nextValue =
      key === "model" || key === "plateType" ? value.toUpperCase() : value;
    onPlateValuesChange({ ...plateValues, [key]: nextValue });
  };

  const submit = () => {
    setSubmitted(true);
    if (supplyType === "plate") {
      if (hasPlateErrors || plateCodeError) return;
      onPlatePreview(plateValues);
      return;
    }

    if (hasErrors || stencilCodeError) return;
    onPreview(values);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-h-[calc(100vh-48px)] w-[min(1344px,calc(100vw-96px))] max-w-none gap-6 overflow-y-auto rounded-2xl border-0 bg-white px-10 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-medium leading-[1.2] text-black">
            {mode === "edit"
              ? supplyType === "plate"
                ? "Consulta de Placa"
                : "Editar Stencil"
              : "Cadastro de Insumos"}
          </DialogTitle>
          <DialogDescription className="text-lg font-normal leading-[1.2] text-[#737373]">
            {mode === "edit"
              ? supplyType === "plate"
                ? "Consulte e/ou edite os dados de um modelo de placa."
                : "Altere as informações do stencil."
              : "Selecione o insumo que deseja cadastrar."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => onSupplyTypeChange("stencil")}
              className={
                supplyType === "stencil"
                  ? "min-h-9 rounded-lg bg-[#1C64F2] px-4 py-2 text-base font-medium text-[#F9F9F9]"
                  : "min-h-9 rounded-lg bg-transparent px-4 py-2 text-base font-medium text-[#404040] hover:bg-muted"
              }
            >
              Stencil
            </Button>
            <Button
              type="button"
              onClick={() => onSupplyTypeChange("plate")}
              className={
                supplyType === "plate"
                  ? "min-h-9 rounded-lg bg-[#1C64F2] px-4 py-2 text-base font-medium text-[#F9F9F9] hover:bg-[#1A56DB]"
                  : "min-h-9 rounded-lg bg-transparent px-4 py-2 text-base font-medium text-[#404040] hover:bg-muted"
              }
            >
              Placa
            </Button>
          </div>
        )}

        {supplyType === "plate" ? (
          <>
            <FormSection
              title="Identificação"
              showError={submitted && hasPlateErrors}
            >
              <div className="grid grid-cols-4 gap-4">
                <Field
                  label="Modelo*"
                  invalid={submitted && Boolean(plateErrors.model)}
                >
                  <Input
                    value={plateValues.model}
                    onChange={(event) =>
                      updatePlate("model", event.target.value)
                    }
                    className="h-10 uppercase"
                  />
                </Field>
                <Field
                  label="Tipo*"
                  invalid={submitted && Boolean(plateErrors.plateType)}
                >
                  <Input
                    value={plateValues.plateType}
                    onChange={(event) =>
                      updatePlate("plateType", event.target.value)
                    }
                    className="h-10 uppercase"
                  />
                </Field>
                <Field
                  label="Fases*"
                  invalid={submitted && Boolean(plateErrors.phases)}
                >
                  <SelectField
                    value={plateValues.phases}
                    onChange={(value) => updatePlate("phases", value)}
                  >
                    <option value="">Selecione</option>
                    <option value="two_phases">F1, F2</option>
                    <option value="single_phase">Fase única</option>
                  </SelectField>
                </Field>
                <Field
                  label="Placas por blank*"
                  invalid={submitted && Boolean(plateErrors.platesPerBlank)}
                >
                  <Input
                    inputMode="numeric"
                    value={plateValues.platesPerBlank}
                    onChange={(event) =>
                      updatePlate("platesPerBlank", event.target.value)
                    }
                    className="h-10"
                  />
                </Field>
              </div>
            </FormSection>

            <div className="mx-auto mt-2 w-[min(730px,100%)] text-center">
              <p className="mb-4 text-lg text-[#737373]">
                Prévia código da placa
              </p>
              <div
                className={`rounded-lg border bg-white px-6 py-5 text-[34px] font-medium leading-tight shadow-sm ${
                  submitted && plateCodeError ? "border-red-500" : ""
                }`}
              >
                {generatedPlateCode || "-"}
              </div>
              {submitted && plateCodeError && (
                <p className="mt-2 text-sm font-semibold text-red-500">
                  {plateCodeError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-8">
              <Button
                type="button"
                onClick={submit}
                className="min-h-9 rounded-lg bg-[#1C64F2] px-4 py-2 text-base font-medium hover:bg-[#1A56DB]"
              >
                {mode === "edit" ? "Salvar alterações" : "Cadastrar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="min-h-9 px-4 py-2 text-base font-medium"
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <FormSection
              title="Identificação"
              showError={
                submitted &&
                hasSectionErrors(errors, [
                  "plateModel",
                  "plateType",
                  "phase",
                  "country",
                  "manufactureId",
                ])
              }
            >
              <div className="grid grid-cols-5 gap-4">
                <Field
                  label="Modelo de placa*"
                  invalid={submitted && Boolean(errors.plateModel)}
                >
              <Input
                value={values.plateModel}
                onChange={(event) => update("plateModel", event.target.value)}
                className="h-10 uppercase"
              />
            </Field>
            <Field
              label="Tipo de placa*"
              invalid={submitted && Boolean(errors.plateType)}
            >
              <Input
                value={values.plateType}
                onChange={(event) => update("plateType", event.target.value)}
                className="h-10 uppercase"
              />
            </Field>
            <Field label="Versão (opcional)">
              <Input
                value={values.version}
                onChange={(event) => update("version", event.target.value)}
                className="h-10 uppercase"
              />
            </Field>
            <Field label="Fase*" invalid={submitted && Boolean(errors.phase)}>
              <SelectField
                value={values.phase}
                onChange={(value) => update("phase", value)}
              >
                <option value="">Selecione</option>
                <option value="1F">1F</option>
                <option value="2F">2F</option>
                <option value="FU">FU</option>
              </SelectField>
            </Field>
            <Field label="Cópia (opcional)">
              <Input
                value={values.copy}
                onChange={(event) => update("copy", event.target.value)}
                className="h-10 uppercase"
              />
            </Field>
            <Field
              label="País de origem*"
              invalid={submitted && Boolean(errors.country)}
            >
              <SelectField
                value={values.country}
                onChange={(value) => update("country", value)}
              >
                <option value="">Selecione</option>
                <option value="Brasil">Brasil</option>
                <option value="China">China</option>
              </SelectField>
            </Field>
            <Field
              label="ID Fabricante*"
              invalid={submitted && Boolean(errors.manufactureId)}
            >
              <Input
                value={isChina(values.country) ? "CHINA" : values.manufactureId}
                onChange={(event) => update("manufactureId", event.target.value)}
                disabled={isChina(values.country)}
                className="h-10 uppercase"
              />
            </Field>
              </div>
            </FormSection>

        <FormSection
          title="Dados cadastrais"
          showError={
            submitted &&
            hasSectionErrors(errors, [
              "thickness",
              "manufacturedAt",
              "addressing",
            ])
          }
        >
          <div className="grid grid-cols-4 gap-4">
            <Field
              label="Espessura*"
              invalid={submitted && Boolean(errors.thickness)}
            >
              <Input
                inputMode="decimal"
                value={values.thickness}
                onChange={(event) => update("thickness", event.target.value)}
                className="h-10"
              />
            </Field>
            <Field
              label="Data de fabricação*"
              invalid={submitted && Boolean(errors.manufacturedAt)}
            >
              <Input
                type="date"
                value={values.manufacturedAt}
                onChange={(event) => update("manufacturedAt", event.target.value)}
                className="h-10"
              />
            </Field>
            <Field
              label="Endereçamento*"
              invalid={submitted && Boolean(errors.addressing)}
            >
              <Input
                value={values.addressing}
                onChange={(event) => update("addressing", event.target.value)}
                className="h-10 uppercase"
              />
            </Field>
            <Field label="Status inicial*">
              {mode === "create" ? (
                <LockedStencilStatus />
              ) : (
                <StencilStatusSelect
                  value={values.status}
                  onChange={(value) => update("status", value)}
                />
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Aprovação técnica"
          showError={
            submitted &&
            hasSectionErrors(errors, [
              "serigraphy",
              "fiducials",
              "finishing",
              "technicalOpinion",
            ])
          }
        >
          <div className="grid grid-cols-4 gap-4">
            <Field
              label="Serigrafia*"
              invalid={submitted && Boolean(errors.serigraphy)}
            >
              <ApprovalSelect
                value={values.serigraphy}
                onChange={(value) => update("serigraphy", value)}
              />
            </Field>
            <Field
              label="Fiduciais*"
              invalid={submitted && Boolean(errors.fiducials)}
            >
              <ApprovalSelect
                value={values.fiducials}
                onChange={(value) => update("fiducials", value)}
              />
            </Field>
            <Field
              label="Acabamento*"
              invalid={submitted && Boolean(errors.finishing)}
            >
              <ApprovalSelect
                value={values.finishing}
                onChange={(value) => update("finishing", value)}
              />
            </Field>
            <Field
              label="Parecer técnico*"
              invalid={submitted && Boolean(errors.technicalOpinion)}
            >
              <SelectField
                value={values.technicalOpinion}
                onChange={(value) => update("technicalOpinion", value)}
              >
                <option value="">Selecione</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Reprovado</option>
              </SelectField>
            </Field>
          </div>
        </FormSection>

        <div className="mx-auto w-[min(730px,100%)] text-center">
          <p className="mb-4 text-lg text-[#737373]">
            Prévia código do stencil
          </p>
          <div
            className={`rounded-lg border bg-white px-6 py-5 text-[34px] font-medium leading-tight shadow-sm ${
              submitted && stencilCodeError ? "border-red-500" : ""
            }`}
          >
            {generatedCode || "-"}
          </div>
          {submitted && stencilCodeError && (
            <p className="mt-2 text-sm font-semibold text-red-500">
              {stencilCodeError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-8">
          <Button
            type="button"
            onClick={submit}
            className="min-h-9 rounded-lg bg-[#1C64F2] px-4 py-2 text-base font-medium"
          >
            {mode === "edit" ? "Salvar alterações" : "Cadastrar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="min-h-9 px-4 py-2 text-base font-medium"
          >
            Cancelar
          </Button>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormSection({
  title,
  showError = false,
  children,
}: {
  title: string;
  showError?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-center gap-4 border-b border-[#E5E5E5] pb-2">
        <h3 className="text-lg font-bold leading-5 text-black">{title}</h3>
        {showError && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-500">
            <AlertCircle className="h-4 w-4" />
            Preencha os campos obrigatórios.
          </span>
        )}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  invalid,
  children,
}: {
  label: string;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-normal leading-5 text-[#171717]">
        {label}
      </span>
      <div className={invalid ? "[&_input]:border-red-500 [&_select]:border-red-500" : ""}>
        {children}
      </div>
    </label>
  );
}

function ApprovalSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SelectField value={value} onChange={onChange}>
      <option value="">Selecione</option>
      <option value="ok">Ok</option>
      <option value="fail">Falha</option>
    </SelectField>
  );
}

function LockedStencilStatus() {
  return (
    <div
      style={stencilStatusColors.validation}
      className="relative flex h-10 w-full items-center justify-between rounded-lg border px-4 pr-10 text-left text-sm shadow-sm"
    >
      <span>{stencilStatusLabels.validation}</span>
      <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-60" />
    </div>
  );
}

function StencilStatusSelect({
  value,
  onChange,
}: {
  value: StencilStatus;
  onChange: (value: StencilStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: StencilStatus[] = [
    "validation",
    "active",
    "obsolete",
    "discarded",
  ];

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={stencilStatusColors[value]}
        className="flex h-10 w-full items-center justify-between rounded-lg border px-4 pr-10 text-left text-sm shadow-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20"
      >
        <span>{stencilStatusLabels[value]}</span>
        <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 flex w-full min-w-[240px] flex-col gap-2 rounded-lg border border-[#E5E5E5] bg-white p-2 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              style={option === value ? stencilStatusColors[option] : undefined}
              className="flex min-h-9 items-center rounded-md border border-transparent px-3 py-2 text-left text-base leading-5 text-[#0A0A0A] hover:bg-muted"
            >
              {stencilStatusLabels[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full appearance-none rounded-lg border border-[#E5E5E5] bg-white px-4 pr-10 text-sm shadow-sm outline-none transition-colors focus:border-[#1C64F2] focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-muted-foreground ${className ?? ""}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
