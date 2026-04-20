import { API_BASE } from "./apiBase";

/** `API_BASE` + path (path는 `/`로 시작 권장). */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/** `fetch`에 API 베이스 URL을 붙인 래퍼. 백엔드 세션 쿠키(JSESSIONID)를 주고받으려면 credentials 필요. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { credentials: "include", ...init });
}

/**
 * JSON 응답을 기대합니다. 비 OK 시 응답 본문(또는 상태 코드)으로 Error를 던집니다.
 * 본문이 비어 있으면 `undefined`로 파싱합니다.
 */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!text.trim()) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

/** POST + JSON 본문 + JSON 파싱. */
export function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** PATCH + JSON 본문 + JSON 파싱. */
export function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * GET + JSON. 401/403·비 OK·빈 본문·네트워크 오류 시 `null` (예외 없음).
 * 세션 확인 등에 사용합니다.
 */
export async function apiGetJsonIfOk<T>(path: string): Promise<T | null> {
  try {
    const res = await apiFetch(path);
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
