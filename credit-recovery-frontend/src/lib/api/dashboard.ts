import { api } from "@/lib/api/client"
import type { DashboardSummary } from "@/lib/api/types"

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary")
  return data
}
