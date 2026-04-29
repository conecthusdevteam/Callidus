import type { Cautela, StatusCautela } from "../data/mockData";

export type UserRole = "ADMIN" | "GESTOR" | "PORTARIA";

export interface AuthUser {
  ativo: boolean;
  email: string;
  id: string;
  nome: string;
  papel: UserRole;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ApiSector {
  ativo: boolean;
  gestorId: string;
  id: string;
  nome: string;
  numeroSetor: number;
}

export interface CreateCautelaPayload {
  itens: { nomeItem: string; quantidade: number }[];
  proprietarioEmail: string;
  proprietarioNome: string;
  retornoItem: boolean;
  setorId: string;
  validade?: string;
}

interface ApiCautela {
  criadoEm: string;
  gestor: { nome: string } | null;
  id: string;
  itens: { nomeItem: string; quantidade: number }[];
  justificativaRejeicao: string | null;
  proprietarioEmail: string;
  proprietarioNome: string;
  respondidoEm: string | null;
  setor: { nome: string } | null;
  status: "APROVADA" | "EM_ANALISE" | "REPROVADA";
  validade: string | null;
}

const API_URL = import.meta.env.VITE_CAUTELA_API_URL || "http://localhost:3000";
const SESSION_KEY = "cautela.auth";

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(email: string, senha: string) {
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify({ email, senha }),
    method: "POST",
    skipAuth: true,
  });
}

export async function logout(refreshToken: string) {
  return apiRequest<{ message: string }>("/auth/logout", {
    body: JSON.stringify({ refreshToken }),
    method: "POST",
  });
}

export async function getSectors() {
  return apiRequest<ApiSector[]>("/sectors?ativo=true");
}

export async function getCautelas(params?: { respondidas?: boolean }) {
  const search = new URLSearchParams();
  if (params?.respondidas !== undefined) {
    search.set("respondidas", String(params.respondidas));
  }

  const cautelas = await apiRequest<ApiCautela[]>(
    `/cautelas${search.size ? `?${search.toString()}` : ""}`,
  );

  return cautelas.map(mapCautela);
}

export async function createCautela(payload: CreateCautelaPayload) {
  const cautela = await apiRequest<ApiCautela>("/cautelas", {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapCautela(cautela);
}

export async function approveCautela(id: string) {
  const cautela = await apiRequest<ApiCautela>(`/cautelas/${id}/aprovar`, {
    method: "PATCH",
  });

  return mapCautela(cautela);
}

export async function rejectCautela(id: string, justificativa: string) {
  const cautela = await apiRequest<ApiCautela>(`/cautelas/${id}/reprovar`, {
    body: JSON.stringify({ justificativa }),
    method: "PATCH",
  });

  return mapCautela(cautela);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const session = getStoredSession();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Não foi possível completar a requisição.";
    try {
      const data = await response.json();
      message = Array.isArray(data.message) ? data.message[0] : data.message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function mapCautela(cautela: ApiCautela): Cautela {
  return {
    aprovadoEm: cautela.status === "APROVADA" ? formatDate(cautela.respondidoEm) : undefined,
    data: formatDate(cautela.criadoEm),
    direcao: cautela.status === "EM_ANALISE" ? "enviado" : "recebido",
    empresa: cautela.setor?.nome ?? "Setor não informado",
    equipamentos: cautela.itens.map((item) => ({
      descricao: item.nomeItem,
      quantidade: item.quantidade,
      serie: "",
    })),
    gestor: cautela.gestor?.nome ?? "Gestor não informado",
    id: cautela.id,
    motivoNegativa: cautela.justificativaRejeicao ?? undefined,
    reprovadoEm: cautela.status === "REPROVADA" ? formatDate(cautela.respondidoEm) : undefined,
    status: mapStatus(cautela.status),
    tipo: "equipamento",
    visitante: cautela.proprietarioNome,
    proprietarioEmail: cautela.proprietarioEmail,
    validade: cautela.validade ? formatDate(cautela.validade) : undefined,
  };
}

function mapStatus(status: ApiCautela["status"]): StatusCautela {
  if (status === "APROVADA") return "Aprovado";
  if (status === "REPROVADA") return "Reprovado";
  return "Em análise";
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
