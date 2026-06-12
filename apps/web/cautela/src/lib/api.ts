import type { Cautela, StatusCautela } from "../data/cautelaTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "GESTOR" | "PORTARIA" | "SOLICITANTE";

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
  documentoProprietario: string;
  empresa: string;
  setorId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipo interno da API
// ─────────────────────────────────────────────────────────────────────────────

type ApiCautelaStatus = "APROVADA" | "EM_ANALISE" | "REPROVADA" | "ENCERRADA";
type ApiCautelaFlowStep =
  | "SOLICITADA"
  | "APROVADA_PELO_GESTOR"
  | "VALIDADA_PELA_PORTARIA"
  | "SAIDA_AUTORIZADA_PELO_GESTOR"
  | "ENCERRADA_PELA_PORTARIA"
  | "REPROVADA";

type ApiPermissionType = "ENTRADA_UNICA" | "LIVRE_TRANSITO";

interface ApiCautela {
  aprovadoEm: string | null;
  badgeGestor: string | null;
  badgePortaria: string | null;
  badgeSolicitante?: string | null;
  criadoEm: string;
  documentoProprietario: string | null;
  entradaValidadaEm?: string | null;
  encerradoEm: string | null;
  empresa: string | null;
  gestor: { nome: string } | null;
  id: string;
  itens: { descricao?: string; nomeItem: string; quantidade: number }[];
  etapaFluxo?: ApiCautelaFlowStep;
  justificativaRejeicao: string | null;
  proprietarioEmail: string;
  proprietarioNome: string;
  rejeitadoEm: string | null;
  respondidoEm: string | null;
  saidaAutorizada: boolean;
  saidaAutorizadaEm: string | null;
  atualizadoEm: string | null;
  setor: { nome: string } | null;
  status: ApiCautelaStatus;
  statusVisualGestor?: ApiCautelaStatus;
  statusVisualPortaria?: ApiCautelaStatus | "ATENCAO" | "AUTORIZADO_A_ENTRAR";
  tipoPermissao?: ApiPermissionType;
  tipoPermissaoAlteradoEm?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Cautelas
// ─────────────────────────────────────────────────────────────────────────────

export async function getCautelas(params?: {
  respondidas?: boolean;
}): Promise<Cautela[]> {
  const search = new URLSearchParams();
  if (params?.respondidas !== undefined) {
    search.set("respondidas", String(params.respondidas));
  }
  const cautelas = await apiRequest<ApiCautela[]>(
    `/cautelas${search.size ? `?${search.toString()}` : ""}`,
  );
  return cautelas.map(mapCautela);
}

export async function createCautela(
  payload: CreateCautelaPayload,
): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>("/cautelas", {
    body: JSON.stringify(payload),
    method: "POST",
  });
  return mapCautela(cautela);
}

export async function approveCautela(
  id: string,
  tipoPermissao: ApiPermissionType = "ENTRADA_UNICA",
): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(`/cautelas/${id}/aprovar`, {
    body: JSON.stringify({ tipoPermissao }),
    method: "PATCH",
  });
  return mapCautela(cautela);
}

export async function rejectCautela(
  id: string,
  justificativa: string,
): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(`/cautelas/${id}/reprovar`, {
    body: JSON.stringify({ justificativa }),
    method: "PATCH",
  });
  return mapCautela(cautela);
}

export async function authorizeDeparture(id: string): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(
    `/cautelas/${id}/autorizar-saida`,
    {
      method: "PATCH",
    },
  );
  return mapCautela(cautela);
}

export async function validateEntry(id: string): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(
    `/cautelas/${id}/validar-entrada`,
    {
      method: "PATCH",
    },
  );
  return mapCautela(cautela);
}

export async function updatePermissionType(
  id: string,
  tipoPermissao: ApiPermissionType,
): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(
    `/cautelas/${id}/tipo-permissao`,
    {
      body: JSON.stringify({ tipoPermissao }),
      method: "PATCH",
    },
  );
  return mapCautela(cautela);
}

export async function markCautelaAsRead(id: string): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(`/cautelas/${id}/visualizar`, {
    method: "PATCH",
  });
  return mapCautela(cautela);
}

export async function closeCautela(id: string): Promise<Cautela> {
  const cautela = await apiRequest<ApiCautela>(
    `/cautelas/${id}/permitir-saida`,
    {
      method: "PATCH",
    },
  );
  return mapCautela(cautela);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const session = getStoredSession();
  const headers = new Headers(options.headers);
  const slowRequestTimer = window.setTimeout(() => {
    window.dispatchEvent(new Event("cautela:slow-request:start"));
  }, 3000);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !options.skipAuth) {
      clearSession();
      window.dispatchEvent(new Event("auth:expired"));
      throw new Error("Sessão expirada.");
    }

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
  } finally {
    window.clearTimeout(slowRequestTimer);
    window.dispatchEvent(new Event("cautela:slow-request:end"));
  }
}

function mapCautela(cautela: ApiCautela): Cautela {
  const tipoPermissao = cautela.tipoPermissao ?? "ENTRADA_UNICA";

  return {
    aprovadoEm: cautela.aprovadoEm
      ? formatDate(cautela.aprovadoEm)
      : cautela.respondidoEm
        ? formatDate(cautela.respondidoEm)
        : undefined,
    data: formatDate(cautela.criadoEm),
    encerradaEm:
      cautela.status === "ENCERRADA" && cautela.encerradoEm
        ? formatDate(cautela.encerradoEm)
        : undefined,
    entradaValidadaEm: cautela.entradaValidadaEm
      ? formatDate(cautela.entradaValidadaEm)
      : undefined,
    empresa: cautela.empresa ?? "Empresa não informada",
    setorId: cautela.setor?.nome ?? "Setor não informado",
    equipamentos: cautela.itens.map((item) => ({
      descricao: item.descricao ?? item.nomeItem,
      quantidade: item.quantidade,
    })),
    gestor: cautela.gestor?.nome ?? "Gestor não informado",
    id: cautela.id,
    motivoNegativa: cautela.justificativaRejeicao ?? undefined,
    documento: cautela.documentoProprietario ?? undefined,
    reprovadoEm:
      cautela.status === "REPROVADA"
        ? formatDate(cautela.rejeitadoEm ?? cautela.respondidoEm)
        : undefined,
    status: mapStatus(cautela),
    visitante: cautela.proprietarioNome,
    proprietarioEmail: cautela.proprietarioEmail,
    etapaFluxo: cautela.etapaFluxo,
    tipoPermissao,
    tipoPermissaoAlteradoEm: cautela.tipoPermissaoAlteradoEm
      ? formatDate(cautela.tipoPermissaoAlteradoEm)
      : undefined,
    livreAcesso: tipoPermissao === "LIVRE_TRANSITO" ? "livre" : "entrada",
    badgeGestor: cautela.badgeGestor,
    badgePortaria: cautela.badgePortaria,
    badgeSolicitante: cautela.badgeSolicitante ?? null,
    saidaAutorizadaEm: cautela.saidaAutorizadaEm
      ? formatDate(cautela.saidaAutorizadaEm)
      : undefined,
    atualizadoEmRaw: cautela.atualizadoEm ?? undefined,
    atualizadoEm: cautela.atualizadoEm
      ? formatDate(cautela.atualizadoEm)
      : undefined,
  };
}

function mapStatus(cautela: ApiCautela): StatusCautela {
  const papel = getStoredSession()?.user.papel;

  if (cautela.saidaAutorizada || cautela.badgeGestor === "AGUARDANDO_SAIDA") {
    return "Saída Autorizada";
  }

  if (
    papel === "PORTARIA" &&
    (cautela.statusVisualPortaria === "AUTORIZADO_A_ENTRAR" ||
      cautela.etapaFluxo === "APROVADA_PELO_GESTOR")
  ) {
    return "Aprovado";
  }

  if (
    papel === "GESTOR" &&
    cautela.status === "EM_ANALISE" &&
    cautela.etapaFluxo === "APROVADA_PELO_GESTOR"
  ) {
    return "Aprovado";
  }

  const { status } = cautela;
  if (status === "APROVADA") return "Aprovado";
  if (status === "REPROVADA") return "Reprovado";
  if (status === "ENCERRADA") return "Encerrada";
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
