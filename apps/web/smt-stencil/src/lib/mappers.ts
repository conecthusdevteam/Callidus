import type { ApiStencil, ApiPlate } from "@/lib/api";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Manaus",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Manaus",
  }).format(new Date(iso));
}

export function mapStencilApiToWash(s: ApiStencil): StencilWash {
  const data = formatDate(s.created_at);
  const hora = formatTime(s.created_at);
  const asset = s.asset;
  return {
    id: s.id,
    data,
    hora,
    codigo: s.stencil_code,
    enderecamento: String(s.addressing).padStart(3, "0"),
    motivo: s.status === "active" ? "Ativo" : "Inativo",
    linha: s.line_name,
    attention: s.non_standard,
    product: s.stencil_code,
    idFabricante: asset?.manufacture_id ?? "—",
    pais: asset?.country ?? "—",
    espessura:
      asset?.thickness != null ? Number(asset.thickness).toFixed(2) : "—",
    totalLavagens: asset?.total_washes ?? 0,
    ultimaLavagem: data,
    operador: s.operator,
    revisao: "—",
    largura: "—",
    altura: "—",
    proximaPrev: "—",
    idLavagem: s.id,
    ultimaLavagemData: data,
    ultimaLavagemHora: hora,
    obs: "",
  };
}

export function mapPlateApiToWash(p: ApiPlate): PlacaWash {
  const data = formatDate(p.created_at);
  const hora = formatTime(p.created_at);
  const asset = p.asset;
  return {
    id: p.id,
    data,
    hora,
    turno: `${p.shift}`,
    modelo: p.plate_model,
    fase: `${p.phase}ª`,
    linha: p.line,
    codigo: p.serial,
    product: p.plate_model,
    codigoBarras: p.blank_id,
    serial: p.serial,
    idFabricante: asset?.manufacturer_id ?? "—",
    pais: asset?.origin_country ?? "—",
    espessura:
      asset?.thickness != null ? Number(asset.thickness).toFixed(2) : "—",
    enderecamento: asset?.addressing ?? "—",
    totalLavagens: asset?.total_washes ?? 0,
    operador: p.operator,
    idLavagem: p.id,
    ultimaLavagemData: data,
    ultimaLavagemHora: hora,
  };
}
