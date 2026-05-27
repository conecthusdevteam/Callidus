import type { Cautela } from "../data/cautelaTypes";

export const STATUS_LABELS: Record<string, string[]> = {
  "Em análise": ["em análise", "analise", "análise", "pendente"],
  Aprovado: ["aprovado", "aprovada"],
  Reprovado: ["reprovado", "reprovada", "negado", "recusado"],
  "Saída Autorizada": [
    "saída autorizada",
    "saida autorizada",
    "atenção",
    "atencao",
    "ação necessária",
    "acao necessaria",
    "aguardando saída",
    "aguardando saida",
  ],
  Encerrada: ["encerrada", "encerrado", "finalizada", "concluida"],
};

export function matchesSearch(cautela: Cautela, term: string): boolean {
  if (!term.trim()) return true;
  const q = term.toLowerCase().trim();
  if (cautela.id.toLowerCase().includes(q)) return true;
  if (cautela.visitante?.toLowerCase().includes(q)) return true;
  if (cautela.gestor?.toLowerCase().includes(q)) return true;
  if (cautela.empresa?.toLowerCase().includes(q)) return true;
  const variants = STATUS_LABELS[cautela.status] ?? [];
  if (variants.some((v) => v.includes(q) || q.includes(v))) return true;
  return false;
}

export function validarDocumento(documento: string): boolean {
  const valor = documento.replace(/\D/g, "");
  if (valor.length === 11) return true;
  if (valor.length >= 7 && valor.length <= 14) return true;
  return false;
}
