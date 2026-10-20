const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3100/api'
const TOKEN_KEY = 'clustr.token'

/** Error de la API con el código que devuelve el servidor (`VALIDATION`, `CONFLICT`…). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

let token: string | null = readToken()
let onUnauthorized: (() => void) | undefined

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(value: string | null) {
  token = value
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar.
  }
}

export const getToken = () => token

/** Se llama cuando el servidor rechaza el token (sesión caducada o cuenta borrada). */
export function handleUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'network')
  }

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, data.error ?? 'UNKNOWN', data.message ?? res.statusText)
  }
  return data as T
}
