export type StatusCautela = "Aprovado" | "Reprovado" | "Em análise";
export type TipoCautela = "comida" | "equipamento" | "smt";

export interface Equipamento {
  descricao: string;
  serie: string;
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
  aprovadoEm?: string;
  reprovadoEm?: string;
  motivoNegativa?: string;
}

export interface TipoCautelaConfig {
  id: TipoCautela;
  titulo: string;
  descricao: string;
  itens: string[];
}

export const mockCautelas: Cautela[] = [
  {
    id: "FO-PR-029.A3/01",
    data: "12/04/2025",
    gestor: "Carlos Mendonça",
    status: "Aprovado",
    visitante: "João Silva",
    empresa: "Callidus",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Notebook Dell Inspiron", serie: "SN-78453-A" },
      { descricao: "Mouse sem fio Logitech", serie: "SN-12345-B" },
    ],
    aprovadoEm: "12/04/2025 09:15",
  },
  {
    id: "FO-PR-029.A3/02",
    data: "13/04/2025",
    gestor: "Marcos Souza",
    status: "Reprovado",
    visitante: "Maria Souza",
    empresa: "Callidus",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Notebook Dell Inspiron", serie: "SN-78453-A" },
    ],
    motivoNegativa: "Não vejo necessidade para uso interno.",
    reprovadoEm: "13/04/2025 14:30",
  },
  {
    id: "FO-PR-029.A3/03",
    data: "15/04/2025",
    gestor: "Roberto Lima",
    status: "Em análise",
    visitante: "Pedro Alves",
    empresa: "Conecthus",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Placa SMT Reflow", serie: "SMT-9923-X" },
      { descricao: "Estação de solda", serie: "SOL-4412-Z" },
    ],
  },
  {
    id: "FO-PR-029.A3/04",
    data: "16/04/2025",
    gestor: "Fernanda Costa",
    status: "Aprovado",
    visitante: "Lucas Rocha",
    empresa: "Conecthus",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Teclado mecânico Keychron", serie: "KEY-0091-M" },
      { descricao: "Fone Bose QC45", serie: "BOSE-5521-N" },
    ],
    aprovadoEm: "16/04/2025 08:45",
  },
  {
    id: "FO-PR-029.A3/05",
    data: "18/04/2025",
    gestor: "Marcos Vieira",
    status: "Reprovado",
    visitante: "Carla Nunes",
    empresa: "Conecthus",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Teclado mecânico Keychron", serie: "KEY-0091-M" },
    ],
    motivoNegativa: "Portaria sem liberação prévia da segurança.",
    reprovadoEm: "18/04/2025 11:00",
  },
  {
    id: "FO-PR-029.A3/06",
    data: "20/04/2025",
    gestor: "José Brandão",
    status: "Em análise",
    visitante: "Bruno Freitas",
    empresa: "Transire",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Alimentador de componentes", serie: "FEED-3310-P" },
    ],
  },
];

export const tiposCautela: TipoCautelaConfig[] = [
  {
    id: "comida",
    titulo: "Comidas e eventos",
    descricao: "O que deve ser cautelado:",
    itens: [
      "Buffets",
      "Bolos e tortas",
      "Centos de salgados e doces",
      "Refeições",
    ],
  },
  {
    id: "equipamento",
    titulo: "Equipamento externo",
    descricao: "O que deve ser cautelado:",
    itens: ["Notebooks", "Mouses", "Teclados", "Fones"],
  },
  {
    id: "smt",
    titulo: "SMT",
    descricao: "O que deve ser cautelado:",
    itens: ["Placas SMT", "Estações de solda", "Alimentadores", "Ferramentas"],
  },
];
