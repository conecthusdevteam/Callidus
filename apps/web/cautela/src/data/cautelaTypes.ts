export type StatusCautela =
  | "Em análise"
  | "Em validação"
  | "Aprovado"
  | "Reprovado"
  | "Saída Autorizada"
  | "Encerrada";
export interface Equipamento {
  descricao: string;
  quantidade?: number;
  serie?: string;
}

export interface Cautela {
  id: string;
  status: StatusCautela;
  empresa: string;
  visitante: string;
  proprietarioEmail: string;
  documento?: string;
  gestor: string;
  data: string;
  equipamentos: Equipamento[];
  setorId: string;
  criadoEm?: string;
  atualizadoEm?: string;

  aprovadoEm?: string;
  entradaValidadaEm?: string;
  reprovadoEm?: string;
  encerradaEm?: string;
  validade?: string;
  tipoPermissaoAlteradoEm?: string;
  saidaAutorizadaEm?: string;
  atualizadoEmRaw?: string;

  motivoNegativa?: string;
  direcao?: "enviado" | "recebido";
  tipo?: string;
  etapaFluxo?: string;
  tipoPermissao?: "ENTRADA_UNICA" | "LIVRE_TRANSITO";
  livreAcesso?: "livre" | "entrada";
  badgeGestor?: string | null;
  badgePortaria?: string | null;
  badgeSolicitante?: string | null;
}
