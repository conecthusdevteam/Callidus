export type StatusCautela = "Aprovado" | "Reprovado" | "Em análise";
export type TipoCautela = "comida" | "equipamento" | "smt";
export type DirecaoCautela = "enviado" | "recebido";

export interface Equipamento {
  descricao: string;
  serie: string;
  quantidade?: number;
}

export interface Cautela {
  id: string;
  data: string;
  gestor: string;
  status: StatusCautela;
  visitante: string;
  empresa: string;
  tipo: TipoCautela;
  equipamentos: Equipamento[];
  direcao: DirecaoCautela;
  aprovadoEm?: string;
  reprovadoEm?: string;
  motivoNegativa?: string;
  proprietarioEmail?: string;
  validade?: string;
}

export interface TipoCautelaConfig {
  id: TipoCautela;
  titulo: string;
  descricao: string;
  itens: string[];
}
