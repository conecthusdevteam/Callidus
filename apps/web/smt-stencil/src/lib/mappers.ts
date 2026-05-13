import type { ApiStencil, ApiPlate } from "@/lib/api";
import type { StencilWash, PlacaWash } from "@/data/mockWashes";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function mapStencilApiToWash(s: ApiStencil): StencilWash {
  const data = formatDate(s.createdAt);
  const hora = formatTime(s.createdAt);
  return {
    id: s.id,
    data,
    hora,
    codigo: s.stencilCode,
    enderecamento: String(s.addressing).padStart(3, "0"),
    motivo: s.status === "active" ? "Ativo" : "Inativo",
    linha: s.lineName,
    product: s.stencilCode,
    idFabricante: s.manufactureId,
    pais: s.country,
    espessura: Number(s.thickness).toFixed(2),
    totalLavagens: s.totalWashes,
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
  const data = formatDate(p.createdAt);
  const hora = formatTime(p.createdAt);
  return {
    id: p.id,
    data,
    hora,
    turno: `${p.shift}`,
    modelo: p.plateModel,
    fase: `${p.phase}ª`,
    linha: p.lineName,
    codigo: p.serialNumber,
    product: p.plateModel,
    codigoBarras: p.blankId,
    serial: p.serialNumber,
    idFabricante: p.plateManufacturerId ?? "—",
    pais: p.country ?? "—",
    espessura: p.thickness != null ? Number(p.thickness).toFixed(2) : "—",
    enderecamento: p.addressing ?? "—",
    totalLavagens: p.totalWashes,
    operador: p.operator,
    idLavagem: p.id,
    ultimaLavagemData: data,
    ultimaLavagemHora: hora,
  };
}
