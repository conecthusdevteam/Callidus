export type StatusCautela =
  | "Em análise"
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
  criadoEm: string;

  aprovadoEm?: string;
  reprovadoEm?: string;
  encerradaEm?: string;
  validade?: string;

  motivoNegativa?: string;
  direcao?: "enviado" | "recebido";
  tipo?: string;
}
