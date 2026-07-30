import { api } from "@/lib/api/client"
import type { Business, BusinessUpdate } from "@/lib/api/types"

export async function getMyBusiness(): Promise<Business> {
  const { data } = await api.get<Business>("/businesses/me")
  return data
}

export async function updateMyBusiness(payload: BusinessUpdate): Promise<Business> {
  const { data } = await api.patch<Business>("/businesses/me", payload)
  return data
}
