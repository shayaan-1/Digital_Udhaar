import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/token"
import type { AccessTokenResponse } from "@/lib/api/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api/v1"

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<AccessTokenResponse>(
      `${API_BASE}/auth/refresh`,
      {},
      { withCredentials: true }
    )
    setAccessToken(data.access_token)
    return data.access_token
  } catch {
    clearAccessToken()
    return null
  }
}

export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Don't try to refresh for auth endpoints themselves
    const url = original.url || ""
    if (url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/refresh")) {
      return Promise.reject(error)
    }

    original._retry = true
    const newToken = await refreshSession()
    if (!newToken) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
      }
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  }
)

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
