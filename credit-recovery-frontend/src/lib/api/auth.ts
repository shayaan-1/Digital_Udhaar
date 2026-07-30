import { api } from "@/lib/api/client"
import type { AccessTokenResponse, LoginRequest, SignupRequest } from "@/lib/api/types"

export async function signup(payload: SignupRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>("/auth/signup", payload)
  return data
}

export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>("/auth/login", payload)
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}

export async function refresh(): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>("/auth/refresh")
  return data
}
