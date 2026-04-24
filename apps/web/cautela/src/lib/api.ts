export type UserRole = "ADMIN" | "GESTOR" | "PORTARIA";
export type CautelaStatusApi = "APROVADA" | "REPROVADA" | "EM_ANALISE";

export interface User {
  ativo: boolean;
  email: string;
  id: string;
  nome: string;
  papel: UserRole;
}

export interface Sector {
  ativo: boolean;
  gestorId: string;
  id: string;
  nome: string;
  numeroSetor: number;
}

export interface CautelaItemApi {
  id: string;
  nomeItem: string;
  quantidade: number;
}

export interface CautelaApi {
  criadoEm: string;
  gestor: Pick<User, "email" | "id" | "nome" | "papel"> | null;
  gestorId: string;
  id: string;
  itens: CautelaItemApi[];
  justificativaRejeicao: string | null;
  proprietarioEmail: string;
  proprietarioNome: string;
  respondidoEm: string | null;
  retornoItem: boolean;
  setor: Sector | null;
  setorId: string;
  solicitadoPor: Pick<User, "email" | "id" | "nome" | "papel"> | null;
  solicitadoPorId: string;
  status: CautelaStatusApi;
  tipo: string;
  validade: string | null;
}

export interface CreateCautelaPayload {
  setorId: string;
  proprietarioNome: string;
  proprietarioEmail: string;
  retornoItem: boolean;
  validade?: string;
  itens: {
    nomeItem: string;
    quantidade: number;
  }[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const API_BASE_URL =
  import.meta.env.VITE_CAUTELA_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const ACCESS_TOKEN_KEY = "cautela.accessToken";
const REFRESH_TOKEN_KEY = "cautela.refreshToken";
const USER_KEY = "cautela.user";

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function saveSession(session: AuthSession) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getStoredUser(): User | null {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Não foi possível completar a requisição.";

    try {
      const error = await response.json();
      message = Array.isArray(error.message)
        ? error.message.join(" ")
        : error.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, senha: string) {
  const session = await apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify({ email, senha }),
    method: "POST",
  });

  saveSession(session);
  return session;
}

export function fetchCurrentUser() {
  return apiRequest<User>("/users/me");
}

export function fetchSectors() {
  return apiRequest<Sector[]>("/sectors?ativo=true");
}

export function fetchCautelas() {
  return apiRequest<CautelaApi[]>("/cautelas");
}

export function createCautela(payload: CreateCautelaPayload) {
  return apiRequest<CautelaApi>("/cautelas", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function approveCautela(id: string) {
  return apiRequest<CautelaApi>(`/cautelas/${id}/aprovar`, {
    method: "PATCH",
  });
}

export function rejectCautela(id: string, justificativa: string) {
  return apiRequest<CautelaApi>(`/cautelas/${id}/reprovar`, {
    body: JSON.stringify({ justificativa }),
    method: "PATCH",
  });
}
