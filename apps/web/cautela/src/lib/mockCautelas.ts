/**
 * mockCautelas.ts  —  src/lib/mockCautelas.ts
 *
 * Simula o backend completo em localStorage.
 * Todas as operações persistem entre abas e reloads.
 */

import type { Cautela } from "../data/cautelaTypes";
import type { CreateCautelaPayload } from "./api";

const STORAGE_KEY = "cautela_mock_db";

// ─── Estado inicial ────────────────────────────────────────────────────────────

const INITIAL_DB: Cautela[] = [
  {
    id: "MOCK-001",
    status: "Em análise",
    empresa: "TI - Infraestrutura",
    visitante: "Carlos Mendonça",
    proprietarioEmail: "carlos.mendonca@conecthus.org.br",
    gestor: "Ana Lima",
    data: "06/05/2025 08:30",
    direcao: "enviado",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Notebook Dell XPS", quantidade: 1, serie: "" },
      { descricao: "Mouse sem fio", quantidade: 1, serie: "" },
    ],
  },
  {
    id: "MOCK-002",
    status: "Aprovado",
    empresa: "Engenharia de Software",
    visitante: "Rafael Torres",
    proprietarioEmail: "rafael.torres@callidus.org.br",
    gestor: "Ana Lima",
    data: "06/05/2025 09:00",
    aprovadoEm: "06/05/2025 09:45",
    validade: "07/05/2025 18:00",
    direcao: "recebido",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "MacBook Pro 14'", quantidade: 1, serie: "MBP-2024-001" },
      { descricao: "Teclado mecânico", quantidade: 1, serie: "" },
      { descricao: "Fonte USB-C", quantidade: 2, serie: "" },
    ],
  },
  {
    id: "MOCK-003",
    status: "Saída Autorizada",
    empresa: "Segurança da Informação",
    visitante: "Juliana Ferreira",
    proprietarioEmail: "juliana.ferreira@conecthus.org.br",
    gestor: "Pedro Saraiva",
    data: "06/05/2025 10:15",
    aprovadoEm: "06/05/2025 11:00",
    direcao: "recebido",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Pendrive criptografado", quantidade: 3, serie: "" },
      { descricao: "HD externo 1TB", quantidade: 1, serie: "HD-EXT-042" },
    ],
  },
  {
    id: "MOCK-004",
    status: "Encerrada",
    empresa: "Suporte ao Usuário",
    visitante: "Beatriz Campos",
    proprietarioEmail: "beatriz.campos@conecthus.org.br",
    gestor: "Pedro Saraiva",
    data: "05/05/2025 14:00",
    aprovadoEm: "05/05/2025 14:30",
    encerradaEm: "05/05/2025 17:45",
    direcao: "recebido",
    tipo: "equipamento",
    equipamentos: [
      {
        descricao: "Notebook Lenovo ThinkPad",
        quantidade: 1,
        serie: "LTP-2023-088",
      },
      { descricao: "Headset USB", quantidade: 1, serie: "" },
    ],
  },
  {
    id: "MOCK-005",
    status: "Reprovado",
    empresa: "Financeiro",
    visitante: "Luciana Prado",
    proprietarioEmail: "luciana.prado@conecthus.org.br",
    gestor: "Pedro Saraiva",
    data: "06/05/2025 08:00",
    motivoNegativa: "Equipamento não consta na lista de ativos aprovados.",
    reprovadoEm: "06/05/2025 08:20",
    direcao: "recebido",
    tipo: "equipamento",
    equipamentos: [
      { descricao: "Drone DJI Mini", quantidade: 1, serie: "DJI-2024-X01" },
    ],
  },
];

// ─── localStorage helpers ──────────────────────────────────────────────────────

function readDb(): Cautela[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Cautela[];
  } catch {
    /* ignora */
  }
  writeDb(INITIAL_DB);
  return INITIAL_DB.map((c) => ({ ...c }));
}

function writeDb(db: Cautela[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function generateId(): string {
  return `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ─── Funções mock ─────────────────────────────────────────────────────────────

export async function getMockCautelas(): Promise<Cautela[]> {
  await delay(300);
  return readDb();
}

/**
 * Portaria cria cautela → fica em "Em análise" até o gestor aprovar.
 * Salva no localStorage para que o gestor veja em até 5s.
 */
export async function mockCreateCautela(
  payload: CreateCautelaPayload,
): Promise<Cautela> {
  await delay(400);
  const db = readDb();

  const nova: Cautela = {
    id: generateId(),
    status: "Em análise",
    empresa: payload.setorId, // em produção viria o nome do setor
    visitante: payload.proprietarioNome,
    proprietarioEmail: payload.proprietarioEmail,
    gestor: "Gestor Responsável", // em produção viria do backend
    data: formatNow(),
    direcao: "enviado",
    tipo: "equipamento",
    equipamentos: payload.itens.map((item) => ({
      descricao: item.nomeItem,
      quantidade: item.quantidade,
      serie: "",
    })),
    validade: payload.validade,
  };

  db.unshift(nova); // insere no início da lista
  writeDb(db);
  return { ...nova };
}

export async function mockApproveCautela(id: string): Promise<Cautela> {
  await delay(400);
  const db = readDb();
  const cautela = db.find((c) => c.id === id);
  if (!cautela) throw new Error("Cautela não encontrada.");
  if (cautela.status !== "Em análise")
    throw new Error(
      `Não é possível aprovar: status atual é "${cautela.status}".`,
    );
  cautela.status = "Aprovado";
  cautela.aprovadoEm = formatNow();
  writeDb(db);
  return { ...cautela };
}

export async function mockRejectCautela(
  id: string,
  justificativa: string,
): Promise<Cautela> {
  await delay(400);
  const db = readDb();
  const cautela = db.find((c) => c.id === id);
  if (!cautela) throw new Error("Cautela não encontrada.");
  if (cautela.status !== "Em análise")
    throw new Error(
      `Não é possível reprovar: status atual é "${cautela.status}".`,
    );
  cautela.status = "Reprovado";
  cautela.motivoNegativa = justificativa;
  cautela.reprovadoEm = formatNow();
  writeDb(db);
  return { ...cautela };
}

/**
 * Gestor autoriza saída: "Aprovado" → "Saída Autorizada"
 * Portaria vê em outra aba no próximo polling (5s)
 */
export async function mockAuthorizeDeparture(id: string): Promise<Cautela> {
  await delay(400);
  const db = readDb();
  const cautela = db.find((c) => c.id === id);
  if (!cautela) throw new Error("Cautela não encontrada.");
  if (cautela.status !== "Aprovado")
    throw new Error(
      `Não é possível autorizar saída: status atual é "${cautela.status}".`,
    );
  cautela.status = "Saída Autorizada";
  writeDb(db);
  return { ...cautela };
}

/**
 * Portaria libera saída: "Saída Autorizada" → "Encerrada"
 * Gestor vê no histórico no próximo polling (5s)
 */
export async function mockCloseCautela(id: string): Promise<Cautela> {
  await delay(400);
  const db = readDb();
  const cautela = db.find((c) => c.id === id);
  if (!cautela) throw new Error("Cautela não encontrada.");
  if (cautela.status !== "Saída Autorizada")
    throw new Error(
      `Não é possível encerrar: status atual é "${cautela.status}".`,
    );
  cautela.status = "Encerrada";
  cautela.encerradaEm = formatNow();
  writeDb(db);
  return { ...cautela };
}

/** Reseta para o estado inicial. No console: mockCautelas.resetMockDb() */
export function resetMockDb(): void {
  writeDb(INITIAL_DB.map((c) => ({ ...c })));
  console.info("[mock] DB resetado.");
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function formatNow(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}
