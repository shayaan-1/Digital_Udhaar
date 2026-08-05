"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/app/page-header"
import { EmptyState, LoadingBlock, StatCard } from "@/components/app/ui-states"
import { getDashboardSummary } from "@/lib/api/dashboard"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { DashboardSummary } from "@/lib/api/types"
import { formatMoney } from "@/lib/format"
import { toast } from "@/components/ui/toast"

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getDashboardSummary()
        if (!cancelled) setSummary(data)
      } catch (err) {
        const msg = getApiErrorMessage(err, "Could not load dashboard.")
        if (!cancelled) {
          setError(msg)
          toast.add({ title: "Dashboard error", description: msg, type: "error" })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today’s credit sales, collections, and total retailer exposure."
        actions={
          <>
            <Button
              render={<Link href="/app/customers/new" />}
              nativeButton={false}
              variant="outline"
              className="border-forest/20"
            >
              Add retailer
            </Button>
            <Button
              render={<Link href="/app/sales/new" />}
              nativeButton={false}
              className="bg-gold text-forest hover:bg-gold/90"
            >
              Record sale
            </Button>
          </>
        }
      />

      {loading && <LoadingBlock label="Loading summary…" />}

      {!loading && error && (
        <EmptyState title="Couldn’t load dashboard" description={error} />
      )}

      {!loading && summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today’s credit sales"
            value={formatMoney(summary.todays_credit_sales)}
          />
          <StatCard
            label="Today’s payments"
            value={formatMoney(summary.todays_payments)}
          />
          <StatCard
            label="Total outstanding"
            value={formatMoney(summary.total_outstanding)}
          />
          <StatCard
            label="Retailers"
            value={String(summary.total_customers)}
            hint={`${summary.active_customers} active · ${summary.archived_customers} archived`}
          />
        </div>
      )}
    </div>
  )
}
