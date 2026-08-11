const ACCESS_TOKEN_KEY = "smt-stencil-access-token";
export const TOKEN_EXPIRED_EVENT = "smt-stencil-token-expired";

interface JwtPayload {
  exp?: number;
}

export function getStoredAccessToken() {
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function storeAccessToken(token: string, rememberMe: boolean) {
  clearStoredAccessToken();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAccessTokenExpiration(token = getStoredAccessToken()) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decoded = JSON.parse(window.atob(paddedPayload)) as JwtPayload;

    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isStoredAccessTokenExpired() {
  const expiresAt = getAccessTokenExpiration();
  return expiresAt !== null && expiresAt <= Date.now();
}

export function notifyTokenExpired() {
  clearStoredAccessToken();
  window.dispatchEvent(new Event(TOKEN_EXPIRED_EVENT));
}
